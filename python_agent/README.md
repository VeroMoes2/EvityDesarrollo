# Agente IA de Longevidad - Evity

Este agente de IA responde preguntas basándose en documentos PDF y TXT que contienen información sobre longevidad, salud y bienestar.

## Estructura de Carpetas

```
python_agent/
├── api_server.py          # API Flask que expone el agente
├── evity_qa_agent.py      # Lógica del agente (embeddings, búsqueda, respuestas)
├── contenidos/            # Coloca aquí tus PDF y TXT
│   └── ejemplo_longevidad.txt
├── vector_index/          # Índice generado automáticamente
│   ├── index_evity.npz
│   └── index_ts
└── requirements.txt       # Dependencias Python
```

## Cómo Funciona

1. **Indexación Automática**: Al hacer la primera pregunta, el agente lee todos los archivos .pdf y .txt en `contenidos/`, crea embeddings y guarda un índice local.

2. **Detección de Cambios**: Si agregas, modificas o eliminas archivos en `contenidos/`, el índice se reconstruye automáticamente.

3. **Búsqueda Semántica**: Cuando haces una pregunta, el agente:
   - Convierte tu pregunta en un embedding
   - Busca los documentos más relevantes
   - Usa GPT-4o-mini para generar una respuesta empática y comprensible

## Agregar Contenido

1. Coloca tus archivos PDF o TXT en la carpeta `contenidos/`
2. El agente detectará los cambios automáticamente
3. En la primera pregunta después de agregar archivos, se reconstruirá el índice

## Iniciar el Servicio

### Opción 1: Manual
```bash
cd python_agent
python3 api_server.py
```

### Opción 2: Con nohup (background)
```bash
nohup python3 python_agent/api_server.py > python_agent/server.log 2>&1 &
```

### Verificar que está corriendo
```bash
curl http://localhost:5001/health
# Respuesta esperada: {"service":"evity-qa-agent","status":"ok"}
```

## Endpoints API

- `GET /health` - Health check
- `POST /ask` - Hacer una pregunta
  ```json
  {
    "question": "¿Qué suplementos son buenos para la longevidad?"
  }
  ```
- `POST /rebuild-index` - Forzar reconstrucción del índice

## Variables de Entorno

- `OPENAI_API_KEY` - Tu API key de OpenAI (requerida)
- `PYTHON_API_PORT` - Puerto del servicio (default: 5001)

## Troubleshooting

### El agente no responde
1. Verifica que el servicio esté corriendo: `curl http://localhost:5001/health`
2. Revisa los logs: `cat python_agent/server.log`
3. Asegúrate de que OPENAI_API_KEY esté configurado

### Error "No se encontró el índice"
- Agrega al menos un archivo .txt o .pdf a `contenidos/`
- O usa el endpoint `/rebuild-index` para forzar la creación

### Errores de OpenAI
- Verifica que tu API key sea válida
- Asegúrate de tener crédito disponible en tu cuenta de OpenAI
