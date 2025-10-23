# Instrucciones para Usar el Agente IA

## Para Usuarios

Tu agente de IA de longevidad ya está configurado y listo para usar. Aquí está cómo funciona:

### 1. Acceder al Agente

1. Inicia sesión en tu cuenta
2. Ve a tu perfil
3. Haz clic en la tarjeta morada "Agente IA de Longevidad"
4. O navega directamente a `/agente-ia`

### 2. Agregar tu Librería de Conocimiento

Para que el agente responda basándose en tu información personalizada:

1. Coloca tus documentos PDF y TXT en la carpeta `python_agent/contenidos/`
2. El agente detectará automáticamente los nuevos archivos
3. La primera vez que hagas una pregunta después de agregar archivos, el agente construirá un índice (esto puede tomar unos minutos)

**Tipos de documentos soportados:**
- Archivos PDF (.pdf)
- Archivos de texto (.txt)
- Idiomas: Español e Inglés (el agente traduce automáticamente al español)

### 3. Hacer Preguntas

Simplemente escribe tu pregunta en el chat. El agente:
- Buscará en tus documentos la información más relevante
- Generará una respuesta clara y empática
- Te dará consejos prácticos basados en tu librería

**Ejemplos de preguntas:**
- "¿Qué suplementos recomiendas para la longevidad?"
- "¿Cómo puedo mejorar mi sueño?"
- "¿Qué ejercicios son mejores para la salud cardiovascular?"

## Para Desarrolladores

### Iniciar el Servicio Python

El servicio Python debe estar corriendo para que el agente funcione:

```bash
# Opción 1: En primer plano (para debugging)
cd python_agent
python3 api_server.py

# Opción 2: En segundo plano
nohup python3 python_agent/api_server.py > python_agent/server.log 2>&1 &

# Verificar que esté corriendo
curl http://localhost:5001/health
```

### Arquitectura del Sistema

```
Cliente (React)
    ↓
Servidor Express (Node.js)
    ↓ HTTP POST /api/ai-agent/ask
Servicio Python (Flask)
    ↓
OpenAI API (embeddings + GPT-4o-mini)
    ↓
Respuesta al usuario
```

### Flujo de Datos

1. **Usuario hace pregunta** → Frontend envía POST a `/api/ai-agent/ask`
2. **Express proxy** → Reenvía a Python service en `localhost:5001/ask`
3. **Python service**:
   - Verifica/reconstruye índice si hay cambios
   - Genera embedding de la pregunta
   - Busca documentos similares (cosine similarity)
   - Construye contexto con los 3 documentos más relevantes
   - Llama a GPT-4o-mini con prompt empático
4. **Respuesta** → Se devuelve al usuario a través de Express

### Variables de Entorno

Configuradas en Replit Secrets:
- `OPENAI_API_KEY` - API key de OpenAI
- `PYTHON_API_PORT` - Puerto del servicio Python (default: 5001)

### Endpoints

**Express (Node.js):**
- `POST /api/ai-agent/ask` - Endpoint protegido (requiere autenticación)

**Python Flask:**
- `GET /health` - Health check
- `POST /ask` - Procesar pregunta
- `POST /rebuild-index` - Reconstruir índice manualmente

### Logs y Debugging

```bash
# Ver logs del servicio Python
cat python_agent/server.log

# Ver logs de Express
# En la consola de Replit

# Test directo del servicio Python
curl -X POST http://localhost:5001/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Qué es la longevidad?"}'
```

### Actualizar la Librería de Conocimiento

1. Agrega/modifica archivos en `python_agent/contenidos/`
2. El agente detectará cambios automáticamente
3. O fuerza reconstrucción:
   ```bash
   curl -X POST http://localhost:5001/rebuild-index
   ```

### Seguridad

- El endpoint está protegido con autenticación
- Las consultas se registran en el audit log
- La API key de OpenAI está en secretos de Replit
- El servicio Python solo escucha en localhost

### Troubleshooting Común

**Error: "El servicio de IA no está iniciado"**
- El servicio Python no está corriendo
- Solución: `python3 python_agent/api_server.py`

**Error: "El agente aún no tiene documentos indexados"**
- No hay archivos en `python_agent/contenidos/`
- Solución: Agrega al menos un archivo PDF o TXT

**Error de OpenAI**
- Verifica que `OPENAI_API_KEY` esté configurado
- Revisa que tengas crédito en tu cuenta de OpenAI
