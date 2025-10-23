# 🚀 Cómo Iniciar el Agente IA

## Paso 1: Abrir una terminal nueva

En Replit, abre la Shell/Terminal (el icono de terminal en la parte inferior)

## Paso 2: Iniciar el servicio Python

Ejecuta uno de estos comandos:

### Opción A - Simple (recomendado para pruebas)
```bash
python3 python_agent/start_service.py
```

### Opción B - Con nohup (para dejarlo corriendo en background)
```bash
cd python_agent && nohup python3 api_server.py > server.log 2>&1 &
```

## Paso 3: Verificar que esté funcionando

En otra terminal, ejecuta:
```bash
curl http://localhost:5001/health
```

Deberías ver: `{"service":"evity-qa-agent","status":"ok"}`

## Paso 4: Probar el agente

1. Inicia sesión en la aplicación
2. Ve a tu perfil
3. Haz clic en la tarjeta morada "Agente IA de Longevidad"
4. Haz una pregunta como: "¿Qué suplementos son buenos para la longevidad?"

## Agregar tu propia librería de conocimiento

1. Coloca tus archivos PDF o TXT en `python_agent/contenidos/`
2. El agente detectará los cambios automáticamente
3. La primera vez construirá el índice (puede tardar unos minutos)

## Troubleshooting

### Error: "El servicio de IA no está iniciado"
- El servicio Python no está corriendo
- Solución: Ejecuta `python3 python_agent/start_service.py`

### Error: "El agente aún no tiene documentos indexados"
- La carpeta `contenidos/` está vacía
- Solución: Ya hay un archivo de ejemplo (`ejemplo_longevidad.txt`), pero puedes agregar más

### Ver los logs
```bash
cat python_agent/server.log
```

## Para detener el servicio

Si lo iniciaste con la Opción A: Presiona `Ctrl+C`

Si lo iniciaste con la Opción B:
```bash
pkill -f "python3 api_server.py"
```
