#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Flask para el Agente de IA de Evity
Expone un endpoint HTTP para que el backend Node.js pueda comunicarse con el agente Python
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from pathlib import Path

# Agregar el directorio actual al path para importar evity_qa_agent
sys.path.insert(0, str(Path(__file__).parent))

from evity_qa_agent import preguntar_qa
from lab_ocr import ocr_and_extract_labs  # 👈 NUEVO: módulo de OCR de laboratorios

app = Flask(__name__)
CORS(app)

# Carpeta base donde están los contenidos
BASE_DIR = Path(__file__).parent


@app.route('/labs/ocr', methods=['POST'])
def labs_ocr():
    """
    Endpoint para OCR de resultados de laboratorio.

    Puede recibir:
    - Un archivo subido como form-data (campo 'file'), o
    - Bytes crudos en el body (lo que hace tu backend Node con axios)
    """
    # 1) Intentar leer como archivo (form-data)
    if 'file' in request.files:
        file_storage = request.files['file']
        file_bytes = file_storage.read()
        filename = file_storage.filename or "archivo_sin_nombre"
    else:
        # 2) Si no hay 'file', leer el body crudo (lo que usamos desde Node)
        file_bytes = request.get_data()
        filename = request.headers.get("X-File-Name", "archivo_sin_nombre")

    try:
        result = ocr_and_extract_labs(file_bytes, filename)
        return jsonify(result)
    except Exception as e:
        print(f"Error en OCR: {e}")
        return jsonify({
            "error": "Error procesando archivo de laboratorio en Python",
            "details": str(e),
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "evity-qa-agent"})


@app.route('/ask', methods=['POST'])
def ask():
    """
    Endpoint principal para hacer preguntas al agente
    Espera: { 
        "question": "tu pregunta aquí", 
        "userName": "Nombre (opcional)",
        "history": [{"role": "user|assistant", "content": "...", "containsGreeting": bool}],
        "hasSentPersonalGreeting": bool,
        "messageHasGreeting": bool
    }
    Devuelve: { "answer": "respuesta del agente" }
    """
    try:
        data = request.get_json()

        if not data or 'question' not in data:
            return jsonify({"error": "Se requiere el campo 'question'"}), 400

        question = data['question']
        user_name = data.get('userName', None)
        history = data.get('history', [])
        has_sent_personal_greeting = data.get('hasSentPersonalGreeting', False)
        message_has_greeting = data.get('messageHasGreeting', False)

        if not question or not question.strip():
            return jsonify({"error": "La pregunta no puede estar vacía"}), 400

        # Llamar al agente Python con personalización opcional y contexto de conversación
        answer = preguntar_qa(question,
                              carpeta_base=str(BASE_DIR),
                              nombre_usuario=user_name,
                              historial=history,
                              ya_saludo=has_sent_personal_greeting,
                              mensaje_tiene_saludo=message_has_greeting)

        return jsonify({"answer": answer, "question": question})

    except FileNotFoundError as e:
        return jsonify({
            "error":
            "No se encontró el índice. Por favor, agrega documentos a la carpeta 'contenidos' primero.",
            "details": str(e)
        }), 404

    except Exception as e:
        print(f"Error procesando pregunta: {e}")
        return jsonify({
            "error": "Error interno del servidor",
            "details": str(e)
        }), 500


@app.route('/rebuild-index', methods=['POST'])
def rebuild_index():
    """
    Endpoint para forzar la reconstrucción del índice
    Útil cuando se agregan nuevos documentos
    """
    try:
        from evity_qa_agent import build_index

        build_index(BASE_DIR)

        return jsonify({"message": "Índice reconstruido exitosamente"})

    except Exception as e:
        print(f"Error reconstruyendo índice: {e}")
        return jsonify({
            "error": "Error reconstruyendo el índice",
            "details": str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('PYTHON_API_PORT', 5001))
    print(f"🚀 Iniciando API del Agente IA en puerto {port}")
    print(f"📁 Carpeta base: {BASE_DIR}")
    print(f"📂 Carpeta de contenidos: {BASE_DIR / 'contenidos'}")

    app.run(host='0.0.0.0', port=port, debug=False)
