#!/bin/bash
# ==============================================================================
# CONTENT OS - SCRIPT DE INICIALIZAÇÃO CONTÍNUA COM AUTO-RECOVERY (24/7)
# ==============================================================================

echo "🚀 Iniciando Content OS Telegram Bot & Painel Flask..."

# Ativa virtualenv se existir
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Instala dependências se necessário
if [ -f "requirements.txt" ]; then
    pip install -q -r requirements.txt
fi

# Executa o orquestrador master que monitora e reinicia processos
python main.py
