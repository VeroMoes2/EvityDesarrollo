#!/bin/bash
# Script para iniciar todos los servicios de Evity
# - Servidor Node.js/Express (puerto 5000)
# - Servicio Python del Agente IA (puerto 5001)

echo "🚀 Iniciando Evity - Plataforma de Longevidad"
echo "=============================================="
echo ""

# Iniciar servidor Node.js en background
echo "📦 Iniciando servidor Node.js..."
npm run dev &
NODE_PID=$!

# Esperar un momento para que Node inicie
sleep 2

# Iniciar servicio Python del Agente IA en background
echo "🤖 Iniciando Agente IA (Python)..."
cd python_agent && python3 api_server.py &
PYTHON_PID=$!
cd ..

echo ""
echo "✅ Servicios iniciados:"
echo "   - Node.js (PID: $NODE_PID) en puerto 5000"
echo "   - Agente IA (PID: $PYTHON_PID) en puerto 5001"
echo ""
echo "Para detener todos los servicios, presiona Ctrl+C"
echo "=============================================="

# Esperar a que ambos procesos terminen
wait
