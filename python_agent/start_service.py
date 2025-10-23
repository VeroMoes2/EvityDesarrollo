#!/usr/bin/env python3
"""
Script simple para iniciar el servicio del Agente IA
Uso: python3 start_service.py
"""

import subprocess
import sys
import os

if __name__ == "__main__":
    # Cambiar al directorio python_agent
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print("=" * 60)
    print("🚀 Iniciando Agente IA de Longevidad - Evity")
    print("=" * 60)
    print()
    print("Puerto: 5001")
    print("Health check: http://localhost:5001/health")
    print()
    print("Para detener el servicio, presiona Ctrl+C")
    print("=" * 60)
    print()
    
    try:
        subprocess.run([sys.executable, "api_server.py"], check=True)
    except KeyboardInterrupt:
        print("\n\n✋ Servicio detenido por el usuario")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
