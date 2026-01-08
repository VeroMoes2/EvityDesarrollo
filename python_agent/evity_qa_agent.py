#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Evity QA Agent – versión bilingüe (ES/EN) con reconstrucción automática del índice.
- Lee .txt y .pdf de ./contenidos
- Detecta idioma y traduce al español si hace falta (para uniformar la búsqueda)
- Genera embeddings y guarda un índice local
- Si agregas/actualizas archivos, se reconstruye automáticamente al preguntar
- Responde con un tono empático y comprensible para pacientes
- Personalización: usa nombre de la persona usuaria, responde saludos y agradecimientos
"""

import argparse
import os
import re
import time
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np
from openai import OpenAI
from pypdf import PdfReader
from tqdm import tqdm

# ---------------------------------------------------------------------------
# Utilidades de lectura
# ---------------------------------------------------------------------------


def _read_txt(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="ignore")


def _read_pdf(p: Path) -> str:
    """Extrae texto de un PDF usando pypdf."""
    text_parts = []
    try:
        reader = PdfReader(str(p))
        for page in reader.pages:
            txt = page.extract_text() or ""
            if txt:
                text_parts.append(txt)
    except Exception as e:
        print(f"[pdf] ⚠️ No pude leer {p.name}: {e}")
    text = "\n".join(text_parts)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text


def collect_documents(contenidos_dir: Path) -> List[Tuple[str, str]]:
    """Lee .txt y .pdf dentro de la carpeta `contenidos/` y devuelve [(nombre, texto)]."""
    docs: List[Tuple[str, str]] = []
    if not contenidos_dir.exists():
        print(f"[warn] No existe carpeta: {contenidos_dir}")
        return docs

    # .txt
    for p in sorted(contenidos_dir.glob("*.txt")):
        try:
            txt = _read_txt(p)
            if txt.strip():
                docs.append((p.name, txt))
        except Exception as e:
            print(f"[txt] ⚠️ Error leyendo {p.name}: {e}")

    # .pdf
    for p in sorted(contenidos_dir.glob("*.pdf")):
        try:
            txt = _read_pdf(p)
            if txt.strip():
                docs.append((p.name, txt))
            else:
                print(f"[pdf] ⚠️ PDF vacío o sin texto: {p.name}")
        except Exception as e:
            print(f"[pdf] ⚠️ Error leyendo {p.name}: {e}")

    print(f"[info] Documentos cargados desde {contenidos_dir}: {len(docs)}")
    return docs


# ---------------------------------------------------------------------------
# Embeddings y helpers
# ---------------------------------------------------------------------------


def detect_and_translate(client: OpenAI, text: str) -> str:
    """
    Detecta idioma y traduce al español si el texto está en inglés (usa un fragmento).
    Si ya está en español, devuelve el texto sin cambios.
    """
    try:
        frag = text[:3000]  # suficiente para decidir idioma y traducir gist
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Detecta el idioma del mensaje del usuario. "
                        "Si está en inglés, tradúcelo al español conservando el significado. "
                        "Si ya está en español, regrésalo igual. "
                        "Devuelve solo el texto resultante, sin comentarios."
                    ),
                },
                {"role": "user", "content": frag},
            ],
            temperature=0.0,
        )
        return resp.choices[0].message.content.strip() or text
    except Exception as e:
        print(f"[trans] ⚠️ Error traduciendo: {e}")
        return text


def embed_texts_openai(
    client: OpenAI, texts: List[str], model: str = "text-embedding-3-small"
) -> np.ndarray:
    """Crea embeddings con OpenAI en batches."""
    batch_size = 50
    all_vecs: List[List[float]] = []
    for i in tqdm(range(0, len(texts), batch_size), desc="Creando embeddings"):
        batch = texts[i : i + batch_size]
        resp = client.embeddings.create(model=model, input=batch)
        vecs = [d.embedding for d in resp.data]
        all_vecs.extend(vecs)
    return np.array(all_vecs, dtype=np.float32)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12))


def search_similar(query_emb: np.ndarray, index_embs: np.ndarray, k: int = 5):
    sims = [cosine_similarity(query_emb, emb) for emb in index_embs]
    top_k = np.argsort(sims)[::-1][:k]
    return top_k, [sims[i] for i in top_k]


# ---------------------------------------------------------------------------
# Construcción del índice
# ---------------------------------------------------------------------------


def build_index(base: Path):
    contenidos_dir = base / "contenidos"
    out_dir = base / "vector_index"
    out_dir.mkdir(parents=True, exist_ok=True)

    docs = collect_documents(contenidos_dir)
    if not docs:
        print("[warn] No hay documentos para indexar.")
        return

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

    names: List[str] = []
    texts: List[str] = []

    print("\n🧠 Detectando idioma y traduciendo si es necesario...\n")
    for name, text in tqdm(docs):
        translated = detect_and_translate(client, text)
        texts.append(translated)
        names.append(name)

    embs = embed_texts_openai(client, texts)

    # Guardamos todo lo necesario para reconstruir el contexto sin leer otra vez
    np.savez(
        out_dir / "index_evity.npz",
        names=np.array(names, dtype=object),
        texts=np.array(texts, dtype=object),
        embeddings=embs,
    )

    # timestamp para invalidación rápida
    (out_dir / "index_ts").write_text(str(time.time()), encoding="utf-8")
    print(f"[ok] Guardado índice con {len(texts)} documentos en {out_dir}")


def latest_content_mtime(contenidos_dir: Path) -> float:
    """Obtiene el mtime más reciente entre todos los .txt y .pdf en contenidos/."""
    mt = 0.0
    for pattern in ("*.txt", "*.pdf"):
        for p in contenidos_dir.glob(pattern):
            try:
                mt = max(mt, p.stat().st_mtime)
            except FileNotFoundError:
                pass
    return mt


def index_mtime(out_dir: Path) -> float:
    """Lee el mtime guardado del índice (o 0 si no existe)."""
    npz = out_dir / "index_evity.npz"
    tsfile = out_dir / "index_ts"
    if npz.exists() and tsfile.exists():
        try:
            return float(tsfile.read_text(encoding="utf-8").strip())
        except Exception:
            return npz.stat().st_mtime
    return 0.0


def ensure_index_fresh(base: Path):
    """Reconstruye el índice automáticamente si hay cambios en contenidos/."""
    contenidos_dir = base / "contenidos"
    out_dir = base / "vector_index"
    latest_mt = latest_content_mtime(contenidos_dir)
    idx_mt = index_mtime(out_dir)

    if latest_mt == 0.0:
        return

    need_build = False
    if not (out_dir / "index_evity.npz").exists():
        need_build = True
    elif latest_mt > idx_mt:
        need_build = True

    if need_build:
        print("\n🔄 Cambios detectados en 'contenidos/'. Reconstruyendo índice...")
        build_index(base)


# ---------------------------------------------------------------------------
# Carga índice
# ---------------------------------------------------------------------------


def load_index(base: Path):
    path = base / "vector_index" / "index_evity.npz"
    if not path.exists():
        raise FileNotFoundError(f"No se encontró el índice: {path}")
    npz = np.load(path, allow_pickle=True)
    names = list(npz["names"])
    texts = list(npz["texts"])
    embs = np.array(npz["embeddings"], dtype=np.float32)
    return names, texts, embs


# ---------------------------------------------------------------------------
# Búsqueda y respuesta (tono empático + personalización)
# ---------------------------------------------------------------------------


def _empathetic_completion(
    client: OpenAI,
    contexto: str,
    pregunta: str,
    nombre_usuario: Optional[str] = None,
    historial: Optional[list] = None,
    ya_saludo: bool = False,
    mensaje_tiene_saludo: bool = False,
) -> str:
    """
    Genera la respuesta con tono empático, usando el contexto y cuidando
    que Evity responda saludos, agradecimientos y use el nombre de la persona
    cuando esté disponible. Respuestas más bien cortas.
    """
    if historial is None:
        historial = []
    
    # Determinar si debemos usar el nombre en esta respuesta
    debe_saludar = mensaje_tiene_saludo and not ya_saludo and nombre_usuario
    
    nombre_info = ""
    if debe_saludar:
        nombre_info = (
            f"El nombre de la persona usuaria es: {nombre_usuario}. "
            "Ya que te está saludando por primera vez, responde el saludo "
            "usando su nombre (ej: '¡Hola, {nombre}!', '¡Buenos días, {nombre}!'). "
            "Luego continúa con tu respuesta si hay una pregunta."
        )
    elif ya_saludo:
        nombre_info = (
            "Ya saludaste a esta persona anteriormente en esta conversación. "
            "NO vuelvas a saludar ni a usar su nombre. "
            "Para preguntas médicas, usa transiciones amables como: "
            "'Perfecto, te explico...', '¡Excelente pregunta!', '¡Qué interesante!', "
            "o responde directamente sin saludo."
        )
    elif not mensaje_tiene_saludo:
        nombre_info = (
            "Esta pregunta NO contiene un saludo. "
            "NO saludes ni digas 'hola' o 'buenos días'. "
            "Usa transiciones amables como: 'Perfecto, te explico...', "
            "'¡Excelente pregunta!', '¡Qué interesante!', o responde directamente."
        )
    
    # Construir historial para el prompt
    historial_text = ""
    if historial:
        historial_text = "\n\nHistorial de la conversación:\n"
        for msg in historial[-6:]:  # Solo últimos 6 mensajes
            rol = "Usuario" if msg.get("role") == "user" else "Evity"
            historial_text += f"{rol}: {msg.get('content', '')}\n"

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Te llamas Evity. Eres un asistente de salud y longevidad especializado. "
                    "Tu propósito es ayudar a las personas a resolver sus dudas específicas sobre salud, "
                    "longevidad, nutrición, ejercicio y bienestar de forma clara y práctica. "
                    "Explicas temas médicos con palabras sencillas, sin jerga técnica, "
                    "y ofreces orientación útil, específica y tranquilizadora.\n\n"
                    "Brevedad:\n"
                    "- Responde en un máximo de 2–3 párrafos cortos o 5–7 oraciones en total.\n"
                    "- Si el mensaje es solo un saludo o un agradecimiento, responde con 1–2 frases breves.\n\n"
                    "Interacción y tono:\n"
                    "- Para preguntas médicas SIN saludo, NO digas 'hola' ni saludes. En su lugar, usa "
                    "transiciones amables como: 'Perfecto, te explico...', '¡Excelente pregunta!', "
                    "'¡Qué interesante!', 'Claro, hablemos de esto...', o simplemente responde directamente.\n"
                    "- Si detectas agradecimientos (ej: 'gracias', 'muchas gracias'), respóndelos de manera "
                    "cálida y breve, agradeciendo la confianza.\n"
                    "- Usa un tono cercano pero profesional, como si hablaras con alguien "
                    "a quien quieres ayudar genuinamente.\n\n"
                    "Estructura general cuando hay una duda de salud (manteniendo brevedad):\n"
                    "1) Explicación sencilla y clara del concepto o problema.\n"
                    "2) 2–4 consejos o pasos prácticos específicos que la persona puede aplicar.\n"
                    "3) Información adicional relevante o matices importantes.\n\n"
                    "IMPORTANTE: Tu objetivo es ayudar a resolver dudas específicas directamente. "
                    "NO termines tus respuestas diciendo 'consulta a un médico' o 'esto no sustituye una consulta médica', "
                    "a menos que la situación sea una emergencia médica real (ej: dolor de pecho intenso, sangrado severo). "
                    "Tu propósito es ser útil y resolver las inquietudes de salud de las personas con información práctica y accionable."
                ),
            },
            {
                "role": "system",
                "content": nombre_info,
            },
            {
                "role": "user",
                "content": (
                    "Usa el siguiente contexto de documentos para responder a la pregunta "
                    "de forma breve, amable y comprensible.\n\n"
                    f"Contexto:\n{contexto}\n"
                    f"{historial_text}\n"
                    f"Pregunta actual de la persona usuaria: {pregunta}\n\n"
                    "Responde de acuerdo a las instrucciones anteriores sobre saludos y tono."
                ),
            },
        ],
        temperature=0.4,
    )
    return resp.choices[0].message.content.strip()


def answer_question(
    base: Path,
    pregunta: str,
    k: int = 5,
    nombre_usuario: Optional[str] = None,
):
    """CLI: imprime respuesta en consola con tono empático y algo de personalización."""
    ensure_index_fresh(base)

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))
    names, texts, embs = load_index(base)

    query_emb = (
        client.embeddings.create(model="text-embedding-3-small", input=pregunta)
        .data[0]
        .embedding
    )
    query_emb = np.array(query_emb, dtype=np.float32)

    top_k, sims = search_similar(query_emb, embs, k=k)

    print("\n📚 Contexto relevante encontrado:\n")
    for idx, score in zip(top_k, sims):
        print(f"→ ({score:.3f}) {names[idx]}")

    contexto = "\n\n".join([texts[i] for i in top_k][:3]) if top_k.size > 0 else ""

    respuesta = _empathetic_completion(
        client,
        contexto,
        pregunta,
        nombre_usuario=nombre_usuario,
    )

    print("\n💬 Respuesta generada:\n")
    print(respuesta)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Evity QA Agent - Busca respuestas en TXT y PDFs (ES/EN) con auto-rebuild, "
            "tono empático y personalización básica."
        )
    )
    parser.add_argument("--carpeta", required=True, help="Carpeta raíz del proyecto")
    parser.add_argument(
        "--build", action="store_true", help="Reconstruye el índice de embeddings"
    )
    parser.add_argument("--ask", type=str, help="Pregunta en lenguaje natural")
    parser.add_argument(
        "--k", type=int, default=5, help="Número de documentos relevantes a recuperar"
    )
    # El nombre de usuario para uso desde CLI (opcional)
    parser.add_argument(
        "--nombre",
        type=str,
        help="Nombre de la persona usuaria (para personalizar la respuesta)",
    )
    args = parser.parse_args()

    base = Path(args.carpeta).resolve()

    if args.build:
        build_index(base)

    if args.ask:
        answer_question(base, args.ask, k=args.k, nombre_usuario=args.nombre)


if __name__ == "__main__":
    main()


# ---------------------------------------------------------------------------
# Función reutilizable (para integraciones): devuelve un string
# ---------------------------------------------------------------------------


def preguntar_qa(
    pregunta: str,
    carpeta_base: str = ".",
    nombre_usuario: Optional[str] = None,
    historial: Optional[list] = None,
    ya_saludo: bool = False,
    mensaje_tiene_saludo: bool = False,
) -> str:
    """
    Devuelve una respuesta en tono empático usando el índice local (si hay cambios, se reconstruye).
    Puede personalizar el trato usando el nombre del usuario si se proporciona.

    Parámetros:
    - pregunta: texto que envía la persona usuaria.
    - carpeta_base: ruta base del proyecto donde están 'contenidos/' y 'vector_index/'.
    - nombre_usuario: (opcional) nombre de la persona usuaria, para que Evity pueda saludarle y despedirse por su nombre.
    - historial: (opcional) lista de mensajes previos en la conversación.
    - ya_saludo: (opcional) si ya se envió un saludo personalizado en esta conversación.
    - mensaje_tiene_saludo: (opcional) si el mensaje actual contiene un saludo.
    """
    if historial is None:
        historial = []
    base = Path(carpeta_base).resolve()
    ensure_index_fresh(base)

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))
    names, texts, embs = load_index(base)

    query_emb = (
        client.embeddings.create(model="text-embedding-3-small", input=pregunta)
        .data[0]
        .embedding
    )
    query_emb = np.array(query_emb, dtype=np.float32)

    top_k, _ = search_similar(query_emb, embs, k=5)
    contexto = "\n\n".join([texts[i] for i in top_k][:3]) if top_k.size > 0 else ""

    return _empathetic_completion(
        client,
        contexto,
        pregunta,
        nombre_usuario=nombre_usuario,
        historial=historial,
        ya_saludo=ya_saludo,
        mensaje_tiene_saludo=mensaje_tiene_saludo,
    )
