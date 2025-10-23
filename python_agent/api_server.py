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

app = Flask(__name__)
CORS(app)

# Carpeta base donde están los contenidos
BASE_DIR = Path(__file__).parent


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "evity-qa-agent"})


@app.route('/ask', methods=['POST'])
def ask():
    """
    Endpoint principal para hacer preguntas al agente
    Espera: { "question": "tu pregunta aquí" }
    Devuelve: { "answer": "respuesta del agente" }
    """
    try:
        data = request.get_json()
        
        if not data or 'question' not in data:
            return jsonify({"error": "Se requiere el campo 'question'"}), 400
        
        question = data['question']
        
        if not question or not question.strip():
            return jsonify({"error": "La pregunta no puede estar vacía"}), 400
        
        # Llamar al agente Python
        answer = preguntar_qa(question, carpeta_base=str(BASE_DIR))
        
        return jsonify({
            "answer": answer,
            "question": question
        })
        
    except FileNotFoundError as e:
        return jsonify({
            "error": "No se encontró el índice. Por favor, agrega documentos a la carpeta 'contenidos' primero.",
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
        
        return jsonify({
            "message": "Índice reconstruido exitosamente"
        })
        
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
