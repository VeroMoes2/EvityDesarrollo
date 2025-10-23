#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Evity QA Agent – versión bilingüe (ES/EN) con reconstrucción automática del índice.
- Lee .txt y .pdf de ./contenidos
- Detecta idioma y traduce al español si hace falta (para uniformar la búsqueda)
- Genera embeddings y guarda un índice local
- Si agregas/actualizas archivos, se reconstruye automáticamente al preguntar
- Responde con un tono empático y comprensible para pacientes
"""

import argparse
import os
import re
import time
from pathlib import Path
from typing import List, Tuple

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
# Búsqueda y respuesta (tono empático para pacientes)
# ---------------------------------------------------------------------------


def _empathetic_completion(client: OpenAI, contexto: str, pregunta: str) -> str:
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Eres un profesional de la salud empático y claro. "
                    "Explicas temas médicos con palabras sencillas, sin jerga técnica, "
                    "y ofreces orientación útil y tranquilizadora. "
                    "Si hay términos médicos, explícalos brevemente. "
                    "Nunca prometas curas y sugiere consultar a un profesional de salud si es necesario."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Usa el siguiente contexto de documentos para responder a la pregunta "
                    "de forma breve, amable y comprensible.\n\n"
                    f"Contexto:\n{contexto}\n\n"
                    f"Pregunta: {pregunta}\n\n"
                    "Incluye: 1) una explicación sencilla, 2) consejos o pasos prácticos, "
                    "3) cuándo consultar a un médico. "
                    "Termina con la frase: 'Esto no sustituye una consulta médica profesional.'"
                ),
            },
        ],
        temperature=0.5,
    )
    return resp.choices[0].message.content.strip()


def answer_question(base: Path, pregunta: str, k: int = 5):
    """CLI: imprime respuesta en consola con tono empático."""
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

    print("\n📚 **Contexto relevante encontrado:**\n")
    for idx, score in zip(top_k, sims):
        print(f"→ ({score:.3f}) {names[idx]}")

    # Construimos el contexto con los textos ya traducidos del índice
    contexto = "\n\n".join([texts[i] for i in top_k][:3]) if top_k.size > 0 else ""

    respuesta = _empathetic_completion(client, contexto, pregunta)

    print("\n💬 **Respuesta generada:**\n")
    print(respuesta)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(
        description="Evity QA Agent - Busca respuestas en TXT y PDFs (ES/EN) con auto-rebuild y tono empático"
    )
    parser.add_argument("--carpeta", required=True, help="Carpeta raíz del proyecto")
    parser.add_argument(
        "--build", action="store_true", help="Reconstruye el índice de embeddings"
    )
    parser.add_argument("--ask", type=str, help="Pregunta en lenguaje natural")
    parser.add_argument(
        "--k", type=int, default=5, help="Número de documentos relevantes a recuperar"
    )
    args = parser.parse_args()

    base = Path(args.carpeta).resolve()

    if args.build:
        build_index(base)

    if args.ask:
        answer_question(base, args.ask, k=args.k)


if __name__ == "__main__":
    main()


# ---------------------------------------------------------------------------
# Función reutilizable (para integraciones): devuelve un string
# ---------------------------------------------------------------------------


def preguntar_qa(pregunta: str, carpeta_base: str = ".") -> str:
    """
    Devuelve una respuesta en tono empático usando el índice local (si hay cambios, se reconstruye).
    Útil para integrarlo desde otros scripts/servicios.
    """
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

    return _empathetic_completion(client, contexto, pregunta)
