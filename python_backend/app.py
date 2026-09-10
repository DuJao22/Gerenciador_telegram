"""
CONTENT OS - SERVIDOR FLASK & API CENTRAL
Servidor web de alta performance que suporta todo o ecossistema:
- Gestão de Conteúdos, Catálogo de Produtos e Pedidos
- CRM de Usuários e Assinaturas VIP
- Monitoramento de Conexão e Identificação do Bot Telegram
- Disparo de Broadcasts e Agendamentos
"""

import os
import json
import time
import shutil
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, render_template_string
from flask_cors import CORS
from dotenv import load_dotenv
import requests

from models import init_db, get_session, User, Content, ScheduledPost, Product, Order
from bot import verify_and_identify_bot, broadcast_message_to_subscribers, bot

load_dotenv()

# Determina o diretório de arquivos estáticos compilados (React Vite)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
possible_dist_dirs = [
  os.path.join(CURRENT_DIR, 'dist'),
  os.path.join(os.getcwd(), 'python_backend', 'dist'),
  os.path.join(os.getcwd(), 'dist'),
  os.path.join(CURRENT_DIR, '..', 'dist'),
]
DIST_DIR = os.path.join(CURRENT_DIR, 'dist')
for candidate in possible_dist_dirs:
  if os.path.exists(candidate) and os.path.exists(os.path.join(candidate, 'index.html')):
    DIST_DIR = candidate
    break

app = Flask(__name__, static_folder=DIST_DIR if os.path.exists(DIST_DIR) else None)
CORS(app) # Permite que o frontend React ou outros clientes consumam a API sem bloqueio

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'content-os-secret-key-2026')
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Garante que as tabelas SQLite e dados iniciais existam
init_db()

# ─────────────────────────────────────────────────────────────
# 1. PÁGINA INICIAL (INDEX), DASHBOARD & ASSETS
# ─────────────────────────────────────────────────────────────

BOT_SETTINGS_FILE = os.path.join(CURRENT_DIR, 'bot_settings.json')

def load_bot_settings():
  default_settings = {
    "telegramToken": os.getenv("TELEGRAM_BOT_TOKEN", "8894323284:AAHyfUMZwE1m5eM1JXmdhkv_oZH1E9yEixY"),
    "botName": "Curso Python Bot",
    "botUsername": "Curso_PythonBot",
    "channelId": os.getenv("TELEGRAM_CHANNEL_ID", "@seucanalpublico"),
    "welcomeMessage": "👋 Olá! Bem-vindo ao Bot Oficial!\nAcesse nossos conteúdos exclusivos, aulas práticas e planos VIP.",
    "vipDescription": "⭐ Acesso VIP ilimitado a todos os módulos, downloads e suporte prioritário por apenas R$ 47,00/mês.",
    "vipPrice": 47.00,
    "pixKey": "pix@lyonbots.com",
    "supportUser": "suporte_lyonbots"
  }
  if os.path.exists(BOT_SETTINGS_FILE):
    try:
      with open(BOT_SETTINGS_FILE, 'r', encoding='utf-8') as f:
        default_settings.update(json.load(f))
    except Exception:
      pass
  return default_settings

def save_bot_settings(data):
  settings = load_bot_settings()
  settings.update(data)
  try:
    with open(BOT_SETTINGS_FILE, 'w', encoding='utf-8') as f:
      json.dump(settings, f, indent=2, ensure_ascii=False)
  except Exception as e:
    print(f"Erro ao salvar {BOT_SETTINGS_FILE}: {e}")
  return settings

def get_dashboard_stats():
  """Coleta métricas rápidas do banco de dados para o index."""
  session = get_session()
  try:
    total_users = session.query(User).count()
    premium_users = session.query(User).filter_by(is_premium=True).count()
    total_products = session.query(Product).count()
    total_orders = session.query(Order).count()
    return {
      "users": total_users,
      "premium": premium_users,
      "products": total_products,
      "orders": total_orders
    }
  except Exception:
    return {"users": 0, "premium": 0, "products": 0, "orders": 0}
  finally:
    session.close()

def render_fallback_dashboard_html():
  """
  Painel de Controle completo e interativo LyonBots:
  Permite gerenciar configurações do bot, token, conteúdos e menus,
  produtos PIX, simulador e disparos em massa diretamente pelo index.
  """
  bot_info = verify_and_identify_bot()
  settings = load_bot_settings()
  bot_name = bot_info.first_name if bot_info else settings.get("botName", "LyonBots")
  bot_user = bot_info.username if bot_info else settings.get("botUsername", "LyonBots_Bot")
  is_online = bot_info is not None
  stats = get_dashboard_stats()

  html = f"""<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LyonBots &middot; Telegram Bot &amp; Web Platform</title>
  <meta name="description" content="Plataforma de automação, agendamento e venda de conteúdo no Telegram com bot integrado 24/7." />
  
  <meta property="og:site_name" content="LyonBots" />
  <meta property="og:title" content="LyonBots - Robô Inteligente de Automação no Telegram" />
  <meta property="og:description" content="Gerencie seu bot de Telegram, agende conteúdos, receba pagamentos via PIX e monitore métricas em tempo real com a LyonBots." />
  <meta property="og:image" content="/og-banner.jpg" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="/og-banner.jpg" />
  <link rel="icon" type="image/jpeg" href="/lyonbots-logo.jpg">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#020617">

  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Plus Jakarta Sans', sans-serif; }}
    code, pre {{ font-family: 'JetBrains Mono', monospace; }}
    .tab-content {{ display: none; }}
    .tab-content.active {{ display: block; }}
    .nav-btn.active {{
      background-color: rgb(6 182 212 / 0.15);
      color: #38bdf8;
      border-color: rgb(56 189 248 / 0.4);
    }}
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between selection:bg-cyan-500 selection:text-white antialiased">
  
  <!-- Header -->
  <header class="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="relative">
          <img src="/lyonbots-logo.jpg" alt="LyonBots Logo" class="w-10 h-10 rounded-xl object-cover border border-cyan-500/40 shadow-lg shadow-cyan-500/20" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'" />
          <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border border-slate-950 rounded-full animate-pulse"></span>
        </div>
        <div>
          <h1 class="text-base font-bold text-white tracking-tight flex items-center gap-2">
            LyonBots
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono">
              Painel de Controle
            </span>
          </h1>
          <p class="text-xs text-slate-400">Telegram Bot Engine &amp; Automação 24/7</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="flex items-center gap-1.5 overflow-x-auto py-1 px-1.5 bg-slate-900/90 rounded-xl border border-slate-800">
        <button onclick="switchTab('dashboard')" id="nav-dashboard" class="nav-btn active px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white border border-transparent transition-all flex items-center gap-1.5 whitespace-nowrap">
          <span>📊 Dashboard</span>
        </button>
        <button onclick="switchTab('settings')" id="nav-settings" class="nav-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-transparent transition-all flex items-center gap-1.5 whitespace-nowrap">
          <span>⚙️ Configurações</span>
        </button>
        <button onclick="switchTab('botcontent')" id="nav-botcontent" class="nav-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-transparent transition-all flex items-center gap-1.5 whitespace-nowrap">
          <span>🤖 Conteúdo do Bot</span>
        </button>
        <button onclick="switchTab('products')" id="nav-products" class="nav-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-transparent transition-all flex items-center gap-1.5 whitespace-nowrap">
          <span>💰 Produtos &amp; PIX</span>
        </button>
        <button onclick="switchTab('simulator')" id="nav-simulator" class="nav-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-transparent transition-all flex items-center gap-1.5 whitespace-nowrap">
          <span>📱 Simulador</span>
        </button>
        <button onclick="switchTab('python')" id="nav-python" class="nav-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-transparent transition-all flex items-center gap-1.5 whitespace-nowrap">
          <span>💻 Código &amp; Arquivos</span>
        </button>
      </nav>

      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold {'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' if is_online else 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}">
          <span class="w-2 h-2 rounded-full {'bg-emerald-400 animate-pulse' if is_online else 'bg-amber-400'}"></span>
          {'Bot Online' if is_online else 'Aguardando Token'}
        </span>
        <a href="https://t.me/{bot_user}" target="_blank" rel="noreferrer" class="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-md shadow-cyan-500/20 flex items-center gap-1.5 whitespace-nowrap">
          <span>Abrir Bot</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content Area -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">

    <!-- TAB 1: DASHBOARD -->
    <div id="tab-dashboard" class="tab-content active space-y-6">
      <!-- Hero Card -->
      <div class="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div class="space-y-2">
            <div class="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
              <span>PLATAFORMA ATIVA NO RENDER</span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {bot_name} <span class="text-cyan-400">(@{bot_user})</span>
            </h2>
            <p class="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Painel de controle com acesso instantâneo às configurações, alteração de token, edição de conteúdos do robô e produtos PIX.
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <button onclick="switchTab('settings')" class="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2">
              <span>⚙️ Configurar Bot</span>
            </button>
            <button onclick="switchTab('simulator')" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition-colors flex items-center gap-2">
              <span>📱 Testar no Simulador</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Action Cards (Similar ao app.news) -->
      <div class="space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Atalhos de Acesso Rápido</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div onclick="switchTab('settings')" class="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group">
            <div class="flex items-center justify-between mb-2">
              <span class="text-2xl">⚙️</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">Ajustar</span>
            </div>
            <h4 class="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">Chave &amp; Token do Bot</h4>
            <p class="text-xs text-slate-400 mt-1">Altere o token da API do Telegram e valide a conexão online.</p>
          </div>

          <div onclick="switchTab('botcontent')" class="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer group">
            <div class="flex items-center justify-between mb-2">
              <span class="text-2xl">🤖</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">Editar</span>
            </div>
            <h4 class="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">Conteúdo &amp; Menus</h4>
            <p class="text-xs text-slate-400 mt-1">Mensagem de boas-vindas /start, plano VIP e botões de comando.</p>
          </div>

          <div onclick="switchTab('products')" class="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group">
            <div class="flex items-center justify-between mb-2">
              <span class="text-2xl">💰</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Gerenciar</span>
            </div>
            <h4 class="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">Produtos &amp; Vendas PIX</h4>
            <p class="text-xs text-slate-400 mt-1">Cadastre cursos, packs e produtos digitais com pagamento via PIX.</p>
          </div>

          <div onclick="switchTab('python')" class="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group">
            <div class="flex items-center justify-between mb-2">
              <span class="text-2xl">💻</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">Editor</span>
            </div>
            <h4 class="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">Código &amp; Arquivos</h4>
            <p class="text-xs text-slate-400 mt-1">Acesse e edite bot.py, models.py, app.py com salvamento no servidor.</p>
          </div>

          <div onclick="switchTab('simulator')" class="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group">
            <div class="flex items-center justify-between mb-2">
              <span class="text-2xl">📱</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">Interativo</span>
            </div>
            <h4 class="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">Simulador Telegram</h4>
            <p class="text-xs text-slate-400 mt-1">Interaja em tempo real com o robô simulando a experiência do cliente.</p>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <span class="text-xs text-slate-400 font-medium block">Total de Usuários</span>
          <span class="text-2xl font-bold text-white tracking-tight mt-1 block">{stats['users']}</span>
          <span class="text-[11px] text-cyan-400 mt-1 block">Inscritos no CRM</span>
        </div>
        <div class="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <span class="text-xs text-slate-400 font-medium block">Membros VIP</span>
          <span class="text-2xl font-bold text-emerald-400 tracking-tight mt-1 block">{stats['premium']}</span>
          <span class="text-[11px] text-slate-400 mt-1 block">Acesso liberado</span>
        </div>
        <div class="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <span class="text-xs text-slate-400 font-medium block">Produtos Ativos</span>
          <span class="text-2xl font-bold text-cyan-400 tracking-tight mt-1 block">{stats['products']}</span>
          <span class="text-[11px] text-slate-400 mt-1 block">Catálogo PIX</span>
        </div>
        <div class="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <span class="text-xs text-slate-400 font-medium block">Pedidos Registrados</span>
          <span class="text-2xl font-bold text-purple-400 tracking-tight mt-1 block">{stats['orders']}</span>
          <span class="text-[11px] text-slate-400 mt-1 block">Transações salvas</span>
        </div>
      </div>

      <!-- Visualização Direta no Index: Arquitetura & Código do Bot -->
      <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>💻 CÓDIGO PYTHON &amp; ARQUITETURA DO ROBÔ</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Acesso Direto no Index
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Visualize a arquitetura do sistema e edite diretamente arquivos como <code>bot.py</code>, <code>models.py</code> e <code>app.py</code>.
            </p>
          </div>
          <button onclick="switchTab('python')" class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer">
            <span>💻 Abrir Editor Completo &amp; Salvar Arquivos</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
          <pre>                    INTERNET
                       │
          ┌────────────┴────────────┐
          │                         │
        TELEGRAM                  PAINEL WEB
          │                         │
          ▼                         ▼
   Python Telebot (bot.py)    Flask (app.py)
          │                         │
          └──────────┬──────────────┘
                     │
                  REST API &amp; ORM
                     │
                     ▼
              ┌─────────────┐
              │   DATABASE  │
              │   SQLite    │
              └─────────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Users     Contents    Purchases
                     │
                     ▼
             APScheduler Worker (scheduler.py)
                     │
                     ▼
              Telegram Bot API</pre>
        </div>
      </div>
    </div>

    <!-- TAB 2: CONFIGURAÇÕES & CHAVE DO BOT -->
    <div id="tab-settings" class="tab-content space-y-6">
      <div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div>
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            <span>⚙️ Configuração da Chave &amp; Token do Bot</span>
          </h3>
          <p class="text-sm text-slate-400 mt-1">
            Conecte seu bot criado no @BotFather. Teste a conexão antes de salvar para garantir que as credenciais estão corretas.
          </p>
        </div>

        <form id="form-bot-settings" class="space-y-4" onsubmit="event.preventDefault(); saveBotSettings();">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Telegram Bot Token (HTTP API):</label>
            <div class="flex gap-2">
              <input type="text" id="cfg-token" value="{settings.get('telegramToken', '')}" placeholder="8894323284:AAHyfUMZwE1m5eM1JXmdhkv_oZH1E9yEixY" class="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-500" />
              <button type="button" onclick="testBotToken()" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors whitespace-nowrap">
                🧪 Testar Conexão
              </button>
            </div>
            <div id="token-test-result" class="mt-2 text-xs font-medium hidden"></div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Nome do Bot:</label>
              <input type="text" id="cfg-botname" value="{settings.get('botName', 'Curso Python Bot')}" class="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Username do Bot (@):</label>
              <input type="text" id="cfg-username" value="{settings.get('botUsername', 'Curso_PythonBot')}" class="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Canal Oficial (@seucanal):</label>
              <input type="text" id="cfg-channel" value="{settings.get('channelId', '@seucanalpublico')}" class="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Chave PIX para Pagamentos:</label>
              <input type="text" id="cfg-pix" value="{settings.get('pixKey', 'pix@lyonbots.com')}" class="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-slate-800">
            <span id="save-status-msg" class="text-xs text-slate-400"></span>
            <button type="submit" class="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20">
              💾 Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- TAB 3: CONTEÚDO DO BOT & MENUS -->
    <div id="tab-botcontent" class="tab-content space-y-6">
      <div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div>
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            <span>🤖 Editar Mensagens &amp; Conteúdos do Bot</span>
          </h3>
          <p class="text-sm text-slate-400 mt-1">
            Personalize a resposta de boas-vindas do comando /start, descrição do plano VIP e links de suporte.
          </p>
        </div>

        <form id="form-bot-content" class="space-y-5" onsubmit="event.preventDefault(); saveBotContent();">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-semibold text-slate-300 uppercase">Mensagem de Boas-Vindas (/start):</label>
              <span class="text-[11px] text-cyan-400">Use {'{nome}'} para citar o usuário</span>
            </div>
            <textarea id="cnt-welcome" rows="4" class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-sans focus:outline-none focus:border-cyan-500">{settings.get('welcomeMessage', '')}</textarea>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-semibold text-slate-300 uppercase">Apresentação do Plano VIP (/vip):</label>
            </div>
            <textarea id="cnt-vipdesc" rows="3" class="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-sans focus:outline-none focus:border-cyan-500">{settings.get('vipDescription', '')}</textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Valor Mensalidade VIP (R$):</label>
              <input type="number" step="0.01" id="cnt-vipprice" value="{settings.get('vipPrice', 47.00)}" class="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Usuário de Suporte no Telegram:</label>
              <input type="text" id="cnt-support" value="{settings.get('supportUser', 'suporte_lyonbots')}" class="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-slate-800">
            <span id="content-status-msg" class="text-xs text-slate-400"></span>
            <button type="submit" class="px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20">
              💾 Salvar Conteúdos do Bot
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- TAB 4: PRODUTOS & VENDAS PIX -->
    <div id="tab-products" class="tab-content space-y-6">
      <div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-xl font-bold text-white flex items-center gap-2">
              <span>💰 Catálogo de Produtos &amp; Vendas PIX</span>
            </h3>
            <p class="text-sm text-slate-400 mt-1">
              Produtos exibidos pelo bot e disponibilizados para pagamento direto via PIX.
            </p>
          </div>
          <button onclick="document.getElementById('modal-new-product').classList.remove('hidden')" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 self-start">
            <span>+ Novo Produto</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th class="px-4 py-3">Produto</th>
                <th class="px-4 py-3">Preço</th>
                <th class="px-4 py-3">Categoria</th>
                <th class="px-4 py-3">VIP</th>
                <th class="px-4 py-3">Checkout</th>
              </tr>
            </thead>
            <tbody id="products-table-body" class="divide-y divide-slate-800/60">
              <tr>
                <td colspan="5" class="px-4 py-6 text-center text-slate-500 text-xs">Carregando catálogo...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 5: SIMULADOR TELEGRAM -->
    <div id="tab-simulator" class="tab-content space-y-6">
      <div class="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div>
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            <span>📱 Simulador do Bot Telegram</span>
          </h3>
          <p class="text-sm text-slate-400 mt-1">
            Teste os comandos, menus interativos e respostas automáticas exatamente como o seu cliente verá.
          </p>
        </div>

        <!-- Chat Container -->
        <div class="max-w-xl mx-auto rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[520px]">
          <!-- Chat Header -->
          <div class="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-base">
              🤖
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-bold text-white" id="sim-bot-name">{bot_name}</h4>
              <p class="text-[11px] text-emerald-400 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                online &middot; bot
              </p>
            </div>
            <button onclick="clearSimulatorChat()" class="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800">
              Limpar
            </button>
          </div>

          <!-- Chat Messages Scroll Area -->
          <div id="sim-messages" class="flex-1 p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            <div class="text-center my-2">
              <span class="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-slate-400">
                Hoje &middot; Início da conversa
              </span>
            </div>

            <!-- Bot Message -->
            <div class="flex flex-col items-start max-w-[85%]">
              <div class="p-3 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 text-xs text-slate-200 space-y-2 shadow-md">
                <p id="sim-msg-welcome" class="whitespace-pre-line">{settings.get('welcomeMessage', 'Olá! Bem-vindo ao Bot Oficial!')}</p>
                <div class="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800">
                  <button onclick="sendSimUserCommand('/vip')" class="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold text-[11px] rounded-lg border border-cyan-500/30 text-center transition-colors">
                    ⭐ Assinar VIP
                  </button>
                  <button onclick="sendSimUserCommand('/produtos')" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] rounded-lg text-center transition-colors">
                    💰 Catálogo PIX
                  </button>
                  <button onclick="sendSimUserCommand('/conteudos')" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] rounded-lg text-center transition-colors">
                    📚 Conteúdos
                  </button>
                  <button onclick="sendSimUserCommand('/suporte')" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] rounded-lg text-center transition-colors">
                    📞 Suporte
                  </button>
                </div>
              </div>
              <span class="text-[9px] text-slate-500 mt-1 ml-1">Agora</span>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="px-3 py-1.5 bg-slate-900/80 border-t border-slate-800/80 flex gap-2 overflow-x-auto text-[11px]">
            <button onclick="sendSimUserCommand('/start')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono whitespace-nowrap">/start</button>
            <button onclick="sendSimUserCommand('/vip')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono whitespace-nowrap">/vip</button>
            <button onclick="sendSimUserCommand('/produtos')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-400 font-mono whitespace-nowrap">/produtos</button>
            <button onclick="sendSimUserCommand('/ajuda')" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono whitespace-nowrap">/ajuda</button>
          </div>

          <!-- Input Area -->
          <form onsubmit="event.preventDefault(); handleSimSubmit();" class="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input type="text" id="sim-input" placeholder="Digite uma mensagem ou comando..." class="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500" />
            <button type="submit" class="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors">
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- TAB 6: CÓDIGO PYTHON & ARQUIVOS DO BOT -->
    <div id="tab-python" class="tab-content space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>💻 CÓDIGO PYTHON &amp; ARQUITETURA</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
              Python 3.10+ / Flask / Telebot
            </span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Visualize, teste a sintaxe e <strong>edite os arquivos do bot diretamente no servidor hospedado</strong> com salvamento seguro e backup.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button onclick="validateCurrentPythonSyntax()" class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-500/30 transition-colors">
            <span>🔍 Validar Sintaxe</span>
          </button>
          <button onclick="saveCurrentPythonFile()" id="btn-save-python" class="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-cyan-600/20 transition-all">
            <span>💾 Salvar no Servidor</span>
          </button>
          <button onclick="copyPythonEditorCode()" class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors">
            <span id="txt-copy-python">📋 Copiar</span>
          </button>
          <button onclick="downloadCurrentPythonFile()" class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors">
            <span>⬇️ Baixar</span>
          </button>
        </div>
      </div>

      <!-- Save & Validation Status Banner -->
      <div id="python-status-banner" class="hidden p-3 rounded-xl border text-xs flex items-center justify-between gap-3">
        <span id="python-status-text"></span>
        <button onclick="document.getElementById('python-status-banner').classList.add('hidden')" class="text-slate-400 hover:text-white text-xs px-2 py-0.5">&times;</button>
      </div>

      <!-- Architecture Diagram (From Screenshot) -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Visão da Arquitetura do Sistema</span>
          </h3>
          <span class="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            Pipeline 24/7 Ativo
          </span>
        </div>
        <div class="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
          <pre>                    INTERNET
                       │
          ┌────────────┴────────────┐
          │                         │
        TELEGRAM                  PAINEL WEB
          │                         │
          ▼                         ▼
   Python Telebot (bot.py)    Flask (app.py)
          │                         │
          └──────────┬──────────────┘
                     │
                  REST API &amp; ORM
                     │
                     ▼
              ┌─────────────┐
              │   DATABASE  │
              │   SQLite    │
              └─────────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Users     Contents    Purchases
                     │
                     ▼
             APScheduler Worker (scheduler.py)
                     │
                     ▼
              Telegram Bot API</pre>
        </div>
      </div>

      <!-- Code Browser & Live Editor Container -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <!-- File Tabs -->
        <div id="python-file-tabs" class="bg-slate-950 px-3 pt-3 border-b border-slate-800 flex items-center gap-1 overflow-x-auto">
          <!-- Populated by loadPythonFilesList() -->
        </div>

        <!-- File Header -->
        <div class="px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div class="flex items-center gap-2">
            <span id="python-file-name" class="font-semibold text-white font-mono">bot.py</span>
            <span class="text-slate-600">•</span>
            <span id="python-file-desc" class="text-slate-300">Bot Telegram supervisionado com validação de token, identificação (@username) e auto-recovery 24/7</span>
          </div>
          <div class="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span id="python-file-lines">0 linhas</span>
          </div>
        </div>

        <!-- Editor Area -->
        <div class="relative bg-slate-950">
          <textarea id="python-code-editor" spellcheck="false" class="w-full h-[550px] p-4 bg-transparent font-mono text-xs text-slate-200 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50" placeholder="Carregando código do servidor..."></textarea>
        </div>

        <!-- Bottom Action Bar -->
        <div class="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span class="text-slate-500 text-[11px]">
            🛡️ Sintaxe testada automaticamente antes de gravar no disco do servidor.
          </span>
          <div class="flex items-center gap-2">
            <button onclick="validateCurrentPythonSyntax()" class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs border border-slate-700 transition-colors">
              Testar Sintaxe
            </button>
            <button onclick="saveCurrentPythonFile()" class="px-4 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs transition-colors">
              Salvar Arquivo
            </button>
          </div>
        </div>
      </div>
    </div>

  </main>

  <!-- MODAL: NOVO PRODUTO -->
  <div id="modal-new-product" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-bold text-white">Cadastrar Novo Produto PIX</h4>
        <button onclick="document.getElementById('modal-new-product').classList.add('hidden')" class="text-slate-400 hover:text-white text-lg">&times;</button>
      </div>
      <form onsubmit="event.preventDefault(); handleCreateProduct();" class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Título do Produto:</label>
          <input type="text" id="prod-title" required placeholder="Ex: Curso Completo de Automação Telegram" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Preço (R$):</label>
            <input type="number" step="0.01" id="prod-price" required placeholder="47.00" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Categoria:</label>
            <select id="prod-cat" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500">
              <option value="Cursos">Cursos</option>
              <option value="Packs">Packs</option>
              <option value="Assinaturas">Assinaturas</option>
              <option value="Ebooks">Ebooks</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Link de Pagamento / Checkout:</label>
          <input type="url" id="prod-url" placeholder="https://pagamento.exemplo.com/checkout/123" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500" />
        </div>
        <div class="flex items-center gap-2 pt-1">
          <input type="checkbox" id="prod-vip" class="rounded bg-slate-950 border-slate-700 text-cyan-500" />
          <label for="prod-vip" class="text-xs text-slate-300">Produto exclusivo para membros VIP</label>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onclick="document.getElementById('modal-new-product').classList.add('hidden')" class="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl">Cancelar</button>
          <button type="submit" class="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl">Salvar Produto</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Footer -->
  <footer class="border-t border-slate-800/80 bg-slate-900/40 py-4 text-center text-xs text-slate-500">
    LyonBots &copy; {datetime.utcnow().year} &middot; Plataforma e Bot Telegram 24/7 &middot; Todos os direitos reservados.
  </footer>

  <!-- Scripts -->
  <script>
    function switchTab(tabId) {{
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
      
      const targetTab = document.getElementById('tab-' + tabId);
      const targetNav = document.getElementById('nav-' + tabId);
      if (targetTab) targetTab.classList.add('active');
      if (targetNav) targetNav.classList.add('active');

      if (tabId === 'products') {{
        loadProductsTable();
      }}
      if (tabId === 'python') {{
        loadPythonFilesList();
      }}
    }}

    async function testBotToken() {{
      const token = document.getElementById('cfg-token').value.trim();
      const resultDiv = document.getElementById('token-test-result');
      resultDiv.classList.remove('hidden', 'text-emerald-400', 'text-rose-400');
      resultDiv.textContent = '⏳ Conectando ao Telegram...';
      
      if (!token) {{
        resultDiv.className = 'mt-2 text-xs font-medium text-rose-400';
        resultDiv.textContent = '❌ Informe o token antes de testar.';
        return;
      }}

      try {{
        const resp = await fetch('/api/bot/verify-token', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ token }})
        }});
        const data = await resp.json();
        if (data.success && data.bot) {{
          resultDiv.className = 'mt-2 text-xs font-medium text-emerald-400';
          resultDiv.textContent = `✅ Conectado com sucesso! Bot: "${{data.bot.first_name}}" (@${{data.bot.username}})`;
          if (data.bot.first_name) document.getElementById('cfg-botname').value = data.bot.first_name;
          if (data.bot.username) document.getElementById('cfg-username').value = data.bot.username;
        }} else {{
          resultDiv.className = 'mt-2 text-xs font-medium text-rose-400';
          resultDiv.textContent = `❌ Erro do Telegram: ${{data.error || 'Token rejeitado'}}`;
        }}
      }} catch (err) {{
        resultDiv.className = 'mt-2 text-xs font-medium text-rose-400';
        resultDiv.textContent = '❌ Falha de rede ao testar token.';
      }}
    }}

    async function saveBotSettings() {{
      const statusMsg = document.getElementById('save-status-msg');
      statusMsg.textContent = 'Salvando...';
      const payload = {{
        telegramToken: document.getElementById('cfg-token').value.trim(),
        botName: document.getElementById('cfg-botname').value.trim(),
        botUsername: document.getElementById('cfg-username').value.trim().replace('@', ''),
        channelId: document.getElementById('cfg-channel').value.trim(),
        pixKey: document.getElementById('cfg-pix').value.trim(),
      }};

      try {{
        const resp = await fetch('/api/bot/settings', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify(payload)
        }});
        const data = await resp.json();
        if (data.success) {{
          statusMsg.className = 'text-xs text-emerald-400 font-semibold';
          statusMsg.textContent = '✅ Configurações salvas com sucesso!';
          document.getElementById('sim-bot-name').textContent = payload.botName;
          setTimeout(() => {{ statusMsg.textContent = ''; }}, 4000);
        }}
      }} catch (e) {{
        statusMsg.className = 'text-xs text-rose-400';
        statusMsg.textContent = '❌ Erro ao salvar configurações.';
      }}
    }}

    async function saveBotContent() {{
      const statusMsg = document.getElementById('content-status-msg');
      statusMsg.textContent = 'Salvando...';
      const payload = {{
        welcomeMessage: document.getElementById('cnt-welcome').value,
        vipDescription: document.getElementById('cnt-vipdesc').value,
        vipPrice: parseFloat(document.getElementById('cnt-vipprice').value) || 47.00,
        supportUser: document.getElementById('cnt-support').value.trim().replace('@', '')
      }};

      try {{
        const resp = await fetch('/api/bot/settings', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify(payload)
        }});
        const data = await resp.json();
        if (data.success) {{
          statusMsg.className = 'text-xs text-emerald-400 font-semibold';
          statusMsg.textContent = '✅ Conteúdos do bot salvos com sucesso!';
          document.getElementById('sim-msg-welcome').textContent = payload.welcomeMessage;
          setTimeout(() => {{ statusMsg.textContent = ''; }}, 4000);
        }}
      }} catch (e) {{
        statusMsg.className = 'text-xs text-rose-400';
        statusMsg.textContent = '❌ Erro ao salvar conteúdos.';
      }}
    }}

    async function loadProductsTable() {{
      const tbody = document.getElementById('products-table-body');
      try {{
        const resp = await fetch('/api/products');
        const products = await resp.json();
        if (!products.length) {{
          tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-slate-500 text-xs">Nenhum produto cadastrado ainda. Clique em "+ Novo Produto".</td></tr>';
          return;
        }}
        tbody.innerHTML = products.map(p => `
          <tr class="hover:bg-slate-900/50 transition-colors">
            <td class="px-4 py-3 font-semibold text-white">${{p.title}}</td>
            <td class="px-4 py-3 font-mono text-cyan-400 font-bold">R$ ${{Number(p.price).toFixed(2)}}</td>
            <td class="px-4 py-3 text-xs text-slate-400">${{p.category || 'Geral'}}</td>
            <td class="px-4 py-3">
              ${{p.is_vip ? '<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">VIP</span>' : '<span class="text-slate-500 text-[10px]">Normal</span>'}}
            </td>
            <td class="px-4 py-3">
              ${{p.payment_url ? `<a href="${{p.payment_url}}" target="_blank" class="text-xs text-cyan-400 hover:underline">Link Checkout</a>` : '<span class="text-slate-600 text-xs">PIX Direto</span>'}}
            </td>
          </tr>
        `).join('');
      }} catch (e) {{
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-rose-400 text-xs">Falha ao carregar produtos.</td></tr>';
      }}
    }}

    async function handleCreateProduct() {{
      const payload = {{
        title: document.getElementById('prod-title').value,
        price: parseFloat(document.getElementById('prod-price').value),
        category: document.getElementById('prod-cat').value,
        payment_url: document.getElementById('prod-url').value,
        is_vip: document.getElementById('prod-vip').checked
      }};

      try {{
        const resp = await fetch('/api/products', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify(payload)
        }});
        if (resp.ok) {{
          document.getElementById('modal-new-product').classList.add('hidden');
          loadProductsTable();
        }}
      }} catch (e) {{
        alert('Erro ao criar produto');
      }}
    }}

    /* Simulador Telegram */
    function appendSimMessage(text, isUser = false, buttons = null) {{
      const container = document.getElementById('sim-messages');
      const msgWrap = document.createElement('div');
      msgWrap.className = isUser ? 'flex flex-col items-end max-w-[85%] ml-auto' : 'flex flex-col items-start max-w-[85%]';
      
      let buttonsHtml = '';
      if (buttons && buttons.length) {{
        buttonsHtml = `<div class="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800">` + 
          buttons.map(b => `<button onclick="sendSimUserCommand('${{b.cmd}}')" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-[11px] rounded-lg text-center transition-colors">${{b.label}}</button>`).join('') +
          `</div>`;
      }}

      msgWrap.innerHTML = `
        <div class="p-3 rounded-2xl ${{isUser ? 'rounded-tr-none bg-cyan-600 text-white' : 'rounded-tl-none bg-slate-900 border border-slate-800 text-slate-200'}} text-xs space-y-2 shadow-md">
          <p class="whitespace-pre-line">${{text}}</p>
          ${{buttonsHtml}}
        </div>
        <span class="text-[9px] text-slate-500 mt-1 ${{isUser ? 'mr-1' : 'ml-1'}}">Agora</span>
      `;
      container.appendChild(msgWrap);
      container.scrollTop = container.scrollHeight;
    }}

    function sendSimUserCommand(cmd) {{
      appendSimMessage(cmd, true);
      setTimeout(() => {{
        processSimBotResponse(cmd);
      }}, 500);
    }}

    function handleSimSubmit() {{
      const input = document.getElementById('sim-input');
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
      sendSimUserCommand(val);
    }}

    function processSimBotResponse(text) {{
      const cmd = text.toLowerCase();
      const welcome = document.getElementById('cnt-welcome') ? document.getElementById('cnt-welcome').value : 'Olá! Bem-vindo ao bot.';
      const vipDesc = document.getElementById('cnt-vipdesc') ? document.getElementById('cnt-vipdesc').value : 'Seja VIP por apenas R$ 47,00.';
      const vipPrice = document.getElementById('cnt-vipprice') ? document.getElementById('cnt-vipprice').value : '47.00';
      const pixKey = document.getElementById('cfg-pix') ? document.getElementById('cfg-pix').value : 'pix@lyonbots.com';

      if (cmd.includes('/start') || cmd.includes('oi') || cmd.includes('ola')) {{
        appendSimMessage(welcome, false, [
          {{ label: '⭐ Assinar VIP', cmd: '/vip' }},
          {{ label: '💰 Catálogo PIX', cmd: '/produtos' }},
          {{ label: '📚 Conteúdos', cmd: '/conteudos' }},
          {{ label: '📞 Suporte', cmd: '/suporte' }}
        ]);
      }} else if (cmd.includes('/vip') || cmd.includes('vip')) {{
        appendSimMessage(`⭐ <b>PLANO VIP LYONBOTS</b>\n\n${{vipDesc}}\n\n💳 <b>Valor:</b> R$ ${{vipPrice}}/mês\n🔑 <b>Chave PIX:</b> <code>${{pixKey}}</code>\n\nEnvie o comprovante para liberar o acesso instantâneo!`, false, [
          {{ label: '🔑 Copiar Chave PIX', cmd: 'Copiar PIX' }},
          {{ label: '🔙 Voltar ao Início', cmd: '/start' }}
        ]);
      }} else if (cmd.includes('/produtos') || cmd.includes('produto') || cmd.includes('catalogo')) {{
        appendSimMessage(`📦 <b>CATÁLOGO DE PRODUTOS DISPONÍVEIS</b>\n\n1. Curso Python Bot &amp; Automação (R$ 47,00)\n2. Pack de Prompts &amp; Scripts (R$ 29,90)\n3. Acesso VIP Vitalício (R$ 97,00)\n\nClique no botão abaixo para gerar a chave PIX:`, false, [
          {{ label: '⭐ Quero o VIP', cmd: '/vip' }},
          {{ label: '📞 Falar com Suporte', cmd: '/suporte' }}
        ]);
      }} else if (cmd.includes('/suporte') || cmd.includes('ajuda')) {{
        appendSimMessage(`📞 <b>CENTRAL DE SUPORTE</b>\n\nNosso time de atendimento está à disposição no Telegram!\nFale diretamente com nosso especialista: @suporte_lyonbots`, false, [
          {{ label: '🔙 Menu Principal', cmd: '/start' }}
        ]);
      }} else {{
        appendSimMessage(`🤖 Recebi sua mensagem: "<i>${{text}}</i>".\n\nEscolha uma opção no menu ou digite <b>/start</b> para recomeçar.`, false, [
          {{ label: '⭐ Ver Plano VIP', cmd: '/vip' }},
          {{ label: '💰 Catálogo PIX', cmd: '/produtos' }}
        ]);
      }}
    }}

    function clearSimulatorChat() {{
      const container = document.getElementById('sim-messages');
      container.innerHTML = `
        <div class="text-center my-2">
          <span class="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-slate-400">
            Chat reiniciado &middot; Digite /start
          </span>
        </div>
      `;
    }}

    let currentLoadedPythonFile = 'bot.py';

    async function loadPythonFilesList() {{
      try {{
        const resp = await fetch('/api/bot/files');
        const data = await resp.json();
        if (!data.success || !data.files) return;

        const tabsContainer = document.getElementById('python-file-tabs');
        tabsContainer.innerHTML = '';

        data.files.forEach(f => {{
          const btn = document.createElement('button');
          btn.className = `flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium rounded-t-lg transition-all shrink-0 ${{
            f.filename === currentLoadedPythonFile
              ? 'bg-slate-900 text-cyan-400 border-t-2 border-t-cyan-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }}`;
          btn.innerHTML = `<span>📄</span><span>${{f.filename}}</span>`;
          btn.onclick = () => selectPythonFile(f.filename, f.desc);
          tabsContainer.appendChild(btn);
        }});

        loadPythonFileContent(currentLoadedPythonFile);
      }} catch (err) {{
        console.error('Erro ao carregar lista de arquivos:', err);
      }}
    }}

    async function selectPythonFile(filename, desc) {{
      currentLoadedPythonFile = filename;
      document.getElementById('python-file-name').textContent = filename;
      if (desc) document.getElementById('python-file-desc').textContent = desc;
      loadPythonFilesList();
    }}

    async function loadPythonFileContent(filename) {{
      const editor = document.getElementById('python-code-editor');
      editor.value = '# Carregando ' + filename + ' do servidor...';
      try {{
        const resp = await fetch(`/api/bot/file?name=${{encodeURIComponent(filename)}}`);
        const data = await resp.json();
        if (data.success) {{
          editor.value = data.content || '';
          const lines = (data.content || '').split('\\n').length;
          const kb = ((data.size || 0) / 1024).toFixed(1);
          document.getElementById('python-file-lines').textContent = `${{lines}} linhas • ${{kb}} KB`;
        }} else {{
          editor.value = '# Erro ao carregar arquivo: ' + (data.error || 'Desconhecido');
        }}
      }} catch (err) {{
        editor.value = '# Falha de rede ao contatar servidor: ' + err.message;
      }}
    }}

    async function saveCurrentPythonFile() {{
      const filename = currentLoadedPythonFile;
      const content = document.getElementById('python-code-editor').value;
      const banner = document.getElementById('python-status-banner');
      const text = document.getElementById('python-status-text');
      const btn = document.getElementById('btn-save-python');

      btn.disabled = true;
      btn.textContent = '⏳ Salvando...';
      banner.className = 'p-3 rounded-xl border text-xs flex items-center justify-between gap-3 bg-cyan-950/60 border-cyan-500/40 text-cyan-300';
      text.textContent = 'Gravando arquivo no servidor e gerando backup...';
      banner.classList.remove('hidden');

      try {{
        const resp = await fetch('/api/bot/file', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ name: filename, content: content }})
        }});
        const data = await resp.json();
        if (data.success) {{
          banner.className = 'p-3 rounded-xl border text-xs flex items-center justify-between gap-3 bg-emerald-950/60 border-emerald-500/40 text-emerald-300';
          text.textContent = `✅ Arquivo "${{filename}}" salvo no disco do servidor com sucesso! Backup criado automaticamente.`;
        }} else {{
          banner.className = 'p-3 rounded-xl border text-xs flex items-center justify-between gap-3 bg-rose-950/60 border-rose-500/40 text-rose-300';
          text.textContent = `❌ Erro ao salvar: ${{data.error || 'Falha desconhecida'}}`;
        }}
      }} catch (err) {{
        banner.className = 'p-3 rounded-xl border text-xs flex items-center justify-between gap-3 bg-rose-950/60 border-rose-500/40 text-rose-300';
        text.textContent = `❌ Falha de rede ao contatar o servidor: ${{err.message}}`;
      }} finally {{
        btn.disabled = false;
        btn.textContent = '💾 Salvar no Servidor';
      }}
    }}

    async function validateCurrentPythonSyntax() {{
      const filename = currentLoadedPythonFile;
      const content = document.getElementById('python-code-editor').value;
      const banner = document.getElementById('python-status-banner');
      const text = document.getElementById('python-status-text');

      banner.className = 'p-3 rounded-xl border text-xs flex items-center justify-between gap-3 bg-slate-900 border-slate-700 text-slate-300';
      text.textContent = 'Analisando sintaxe...';
      banner.classList.remove('hidden');

      try {{
        const resp = await fetch('/api/bot/validate-syntax', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ name: filename, content: content }})
        }});
        const data = await resp.json();
        if (data.success && data.valid) {{
          banner.className = 'p-3 rounded-xl border text-xs flex items-center justify-between gap-3 bg-emerald-950/60 border-emerald-500/40 text-emerald-300';
          text.textContent = `✅ Sintaxe perfeita! ${{filename}} está 100% válido e pronto para execução.`;
        }} else {{
          banner.className = 'p-3 rounded-xl border text-xs flex items-center justify-between gap-3 bg-rose-950/60 border-rose-500/40 text-rose-300';
          text.textContent = `❌ ${{data.error || 'Erro de sintaxe encontrado'}}`;
        }}
      }} catch (err) {{
        banner.className = 'p-3 rounded-xl border text-xs flex items-center justify-between gap-3 bg-rose-950/60 border-rose-500/40 text-rose-300';
        text.textContent = `❌ Falha ao validar: ${{err.message}}`;
      }}
    }}

    function copyPythonEditorCode() {{
      const editor = document.getElementById('python-code-editor');
      navigator.clipboard.writeText(editor.value);
      const txt = document.getElementById('txt-copy-python');
      txt.textContent = '✅ Copiado!';
      setTimeout(() => {{ txt.textContent = '📋 Copiar'; }}, 2000);
    }}

    function downloadCurrentPythonFile() {{
      const filename = currentLoadedPythonFile;
      const content = document.getElementById('python-code-editor').value;
      const blob = new Blob([content], {{ type: 'text/plain;charset=utf-8' }});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }}

    // Auto load on open with URL tab detection
    document.addEventListener('DOMContentLoaded', () => {{
      loadProductsTable();
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || (window.location.hash ? window.location.hash.replace('#', '') : null);
      if (tabParam === 'python' || tabParam === 'code' || tabParam === 'arquivos') {{
        switchTab('python');
      }}
    }});
  </script>
</body>
</html>"""
  return html

@app.route('/', methods=['GET'])
def root_index():
  """
  Serve a interface web (Index):
  1. Se o build completo do React (dist/index.html) existir, serve o React SPA.
  2. Se a requisição explícita for JSON (ex: curl ou Accept: application/json), retorna status JSON.
  3. Caso contrário, serve a página web moderna em HTML.
  """
  # Se o cliente solicitar JSON explicitamente:
  if request.headers.get('Accept') == 'application/json' or request.args.get('format') == 'json':
    return jsonify({
      "status": "online",
      "service": "Curso Python Bot & Content OS Engine",
      "platform": "Render Ready",
      "timestamp": datetime.utcnow().isoformat(),
      "docs": {
        "health": "/api/health",
        "bot_status": "/api/bot/status",
        "ping": "/ping"
      }
    }), 200

  # 1. Se o frontend React estiver compilado na pasta dist:
  dist_index = os.path.join(DIST_DIR, 'index.html')
  if os.path.exists(dist_index):
    return send_from_directory(DIST_DIR, 'index.html')

  # 2. Se não houver dist compilado, renderiza o painel visual em HTML:
  return render_fallback_dashboard_html()

@app.route('/assets/<path:path>')
def serve_static_assets(path):
  """Serve arquivos JS, CSS e imagens da pasta dist/assets do React."""
  assets_dir = os.path.join(DIST_DIR, 'assets')
  if os.path.exists(os.path.join(assets_dir, path)):
    return send_from_directory(assets_dir, path)
  return jsonify({"error": "Asset not found"}), 404

@app.route('/<path:path>')
def catch_all_spa(path):
  """Permite navegação e recarga direta nas rotas do frontend SPA."""
  if path.startswith('api/') or path == 'ping':
    return jsonify({"error": "Endpoint não encontrado"}), 404
  file_path = os.path.join(DIST_DIR, path)
  if os.path.exists(file_path) and os.path.isfile(file_path):
    return send_from_directory(DIST_DIR, path)
  dist_index = os.path.join(DIST_DIR, 'index.html')
  if os.path.exists(dist_index):
    return send_from_directory(DIST_DIR, 'index.html')
  return render_fallback_dashboard_html()

@app.route('/ping', methods=['GET'])
def ping():
  """Endpoint leve para ping keep-alive anti-hibernação do Render."""
  return jsonify({"pong": True, "time": datetime.utcnow().isoformat()}), 200

@app.route('/api/health', methods=['GET'])
def healthcheck():
  """Verifica se o servidor Flask e o banco de dados estão operacionais."""
  return jsonify({
    "status": "healthy",
    "timestamp": datetime.utcnow().isoformat(),
    "service": "Content OS Backend Engine",
    "render_service_id": os.getenv("RENDER_SERVICE_ID", "local")
  })


@app.route('/api/bot/status', methods=['GET'])
def get_bot_status():
  """
  Verifica a conexão do bot com o Telegram, identificando nome,
  username e ID a partir do TELEGRAM_BOT_TOKEN.
  """
  bot_info = verify_and_identify_bot()
  
  if bot_info:
    return jsonify({
      "connected": True,
      "bot": {
        "id": bot_info.id,
        "first_name": bot_info.first_name,
        "username": bot_info.username,
        "can_join_groups": getattr(bot_info, 'can_join_groups', True),
        "can_read_all_group_messages": getattr(bot_info, 'can_read_all_group_messages', False)
      },
      "supervisor": "Ativo (Loop 24/7 de Alta Resiliência)"
    })
  else:
    return jsonify({
      "connected": False,
      "error": "Token ausente ou inválido. Configure TELEGRAM_BOT_TOKEN no arquivo .env",
      "supervisor": "Aguardando token válido"
    }), 200

@app.route('/api/bot/verify-token', methods=['POST'])
def test_telegram_token():
  """
  Testa dinamicamente qualquer token enviado no corpo da requisição
  diretamente na API do Telegram antes de salvar no .env.
  Usa timeout estendido (20s) e retentativa para evitar erro de 'Read timed out' em hospedagens na nuvem (Render, VPS).
  """
  data = request.json or {}
  token = data.get("token", "").strip()

  if not token:
    return jsonify({"success": False, "error": "Token não fornecido"}), 400

  url = f"https://api.telegram.org/bot{token}/getMe"
  last_error = None

  for attempt in range(2):
    try:
      # Timeout de 20s para permitir conexões lentas ou com proxy em nuvem (Render/VPS)
      resp = requests.get(url, timeout=20)
      res_data = resp.json()

      if res_data.get("ok"):
        result = res_data.get("result", {})
        return jsonify({
          "success": True,
          "bot": {
            "id": result.get("id"),
            "first_name": result.get("first_name"),
            "username": result.get("username")
          }
        })
      else:
        return jsonify({
          "success": False,
          "error": res_data.get("description", "Token recusado pelo Telegram")
        }), 400
    except requests.exceptions.Timeout:
      last_error = f"Tempo limite excedido ao contatar api.telegram.org (timeout 20s, tentativa {attempt + 1}/2). A rede da hospedagem está lenta para contatar os servidores do Telegram."
      time.sleep(1)
    except Exception as e:
      last_error = f"Falha de rede ao contatar Telegram: {str(e)}"
      time.sleep(1)

  return jsonify({
    "success": False, 
    "error": last_error or "Não foi possível conectar à API do Telegram no momento.",
    "can_force_save": True
  }), 504

# ─────────────────────────────────────────────────────────────
# GESTÃO & EDIÇÃO DE ARQUIVOS DO BOT DIRETAMENTE NO HOSPEDADO
# ─────────────────────────────────────────────────────────────

ALLOWED_BOT_FILES = {
  'bot.py': {
    'title': 'bot.py (Lógica Principal do Bot)',
    'desc': 'Comandos /start, /vip, catálogo de produtos, teclado inline e respostas automáticas.',
    'type': 'python'
  },
  'models.py': {
    'title': 'models.py (Banco de Dados & Tabelas)',
    'desc': 'Modelos SQLAlchemy: Usuários, Conteúdos, Pedidos PIX e Postagens Agendadas.',
    'type': 'python'
  },
  'scheduler.py': {
    'title': 'scheduler.py (Worker de Agendamento)',
    'desc': 'Processo em background para publicação programada no canal do Telegram.',
    'type': 'python'
  },
  'main.py': {
    'title': 'main.py (Supervisor de Processos 24/7)',
    'desc': 'Inicialização simultânea do Flask e do Bot com auto-recuperação contra quedas.',
    'type': 'python'
  },
  'app.py': {
    'title': 'app.py (Servidor Web Flask & API)',
    'desc': 'Rotas REST da API e entrega do Painel de Controle web.',
    'type': 'python'
  },
  'bot_settings.json': {
    'title': 'bot_settings.json (Configurações de Textos & PIX)',
    'desc': 'Textos de boas-vindas, valores do VIP, chave PIX e links de suporte.',
    'type': 'json'
  },
  '.env.example': {
    'title': '.env.example (Modelo de Chaves & Ambiente)',
    'desc': 'Exemplo das chaves TELEGRAM_BOT_TOKEN, INSTAGRAM_URL, etc.',
    'type': 'env'
  },
  'render.yaml': {
    'title': 'render.yaml (Blueprint de Deploy no Render)',
    'desc': 'Configuração de build e start no Render Cloud.',
    'type': 'yaml'
  },
  'Procfile': {
    'title': 'Procfile (Inicialização no Render/VPS)',
    'desc': 'Comando de start do Render (web: python main.py).',
    'type': 'text'
  },
  'requirements.txt': {
    'title': 'requirements.txt (Bibliotecas Python)',
    'desc': 'Dependências pip instaladas na hospedagem.',
    'type': 'text'
  }
}

def resolve_bot_file_path(filename):
  """Resolve o caminho absoluto seguro do arquivo no backend, impedindo navegação traversal."""
  clean_name = os.path.basename(filename)
  if clean_name not in ALLOWED_BOT_FILES:
    return None
  
  # Procura no diretório do app.py
  app_dir = os.path.dirname(os.path.abspath(__file__))
  path1 = os.path.join(app_dir, clean_name)
  if os.path.exists(path1):
    return path1
    
  # Procura no diretório de trabalho atual
  path2 = os.path.join(os.getcwd(), clean_name)
  if os.path.exists(path2):
    return path2
    
  # Caso ainda não exista (ex: bot_settings.json novo), retorna o caminho em app_dir
  return path1

@app.route('/api/bot/files', methods=['GET'])
def list_bot_files():
  """Lista todos os arquivos do robô disponíveis para visualização e edição na nuvem."""
  file_list = []
  app_dir = os.path.dirname(os.path.abspath(__file__))

  for filename, meta in ALLOWED_BOT_FILES.items():
    filepath = resolve_bot_file_path(filename)
    exists = os.path.exists(filepath) if filepath else False
    size = os.path.getsize(filepath) if exists else 0
    mtime = datetime.fromtimestamp(os.path.getmtime(filepath)).strftime("%d/%m/%Y %H:%M:%S") if exists else "-"
    
    file_list.append({
      "filename": filename,
      "title": meta['title'],
      "desc": meta['desc'],
      "type": meta['type'],
      "exists": exists,
      "size": size,
      "last_modified": mtime
    })

  return jsonify({
    "success": True,
    "files": file_list,
    "base_dir": app_dir
  })

@app.route('/api/bot/file', methods=['GET', 'POST'])
def handle_bot_file():
  """
  GET: Lê o conteúdo de um arquivo do bot.
  POST: Salva novas alterações no arquivo do bot com validação de sintaxe e backup automático.
  """
  if request.method == 'GET':
    filename = request.args.get('name', 'bot.py')
    filepath = resolve_bot_file_path(filename)
    
    if not filepath:
      return jsonify({"success": False, "error": f"Arquivo '{filename}' não permitido ou inválido."}), 400
      
    if not os.path.exists(filepath):
      # Se for bot_settings.json, inicializa com as configurações atuais
      if filename == 'bot_settings.json':
        content = json.dumps(load_bot_settings(), indent=2, ensure_ascii=False)
      else:
        return jsonify({"success": False, "error": f"Arquivo '{filename}' ainda não existe no servidor."}), 404
    else:
      try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
          content = f.read()
      except Exception as e:
        return jsonify({"success": False, "error": f"Erro ao ler arquivo: {str(e)}"}), 500

    size = len(content.encode('utf-8'))
    return jsonify({
      "success": True,
      "filename": filename,
      "content": content,
      "size": size,
      "meta": ALLOWED_BOT_FILES.get(filename, {})
    })

  # POST: Salva o conteúdo
  data = request.json or {}
  filename = data.get('name', '').strip()
  content = data.get('content', '')

  if not filename:
    return jsonify({"success": False, "error": "Nome do arquivo não fornecido."}), 400

  filepath = resolve_bot_file_path(filename)
  if not filepath:
    return jsonify({"success": False, "error": f"Arquivo '{filename}' não permitido para edição."}), 400

  meta = ALLOWED_BOT_FILES.get(filename, {})
  file_type = meta.get('type')

  # Validação de sintaxe antes de salvar para evitar quebrar o robô
  if file_type == 'python':
    try:
      compile(content, filename, 'exec')
    except SyntaxError as syn_err:
      return jsonify({
        "success": False,
        "error": f"Erro de sintaxe Python na linha {syn_err.lineno}: {syn_err.msg}",
        "line": syn_err.lineno,
        "offset": syn_err.offset,
        "text": syn_err.text
      }), 400
  elif file_type == 'json':
    try:
      json.loads(content)
    except Exception as json_err:
      return jsonify({
        "success": False,
        "error": f"JSON inválido: {str(json_err)}"
      }), 400

  # Cria backup seguro antes de sobrescrever
  try:
    app_dir = os.path.dirname(os.path.abspath(__file__))
    backup_dir = os.path.join(app_dir, '.backups')
    os.makedirs(backup_dir, exist_ok=True)
    if os.path.exists(filepath):
      timestamp = int(time.time())
      backup_file = os.path.join(backup_dir, f"{filename}.{timestamp}.bak")
      shutil.copy2(filepath, backup_file)
  except Exception as bkp_err:
    print(f"⚠️ Aviso ao criar backup: {bkp_err}")

  # Salva o arquivo no disco
  try:
    with open(filepath, 'w', encoding='utf-8') as f:
      f.write(content)

    # Se for bot_settings.json, atualiza também a memória
    if filename == 'bot_settings.json':
      try:
        new_settings = json.loads(content)
        save_bot_settings(new_settings)
        if 'telegramToken' in new_settings and new_settings['telegramToken']:
          os.environ['TELEGRAM_BOT_TOKEN'] = new_settings['telegramToken'].strip()
      except Exception:
        pass

    return jsonify({
      "success": True,
      "message": f"Arquivo '{filename}' salvo e validado com sucesso no servidor!",
      "filename": filename,
      "size": len(content.encode('utf-8')),
      "saved_at": datetime.utcnow().strftime("%d/%m/%Y %H:%M:%S UTC")
    })
  except Exception as write_err:
    return jsonify({"success": False, "error": f"Erro ao gravar no disco: {str(write_err)}"}), 500

@app.route('/api/bot/validate-syntax', methods=['POST'])
def validate_python_syntax():
  """Testa a sintaxe de um código Python ou JSON sem salvar no disco."""
  data = request.json or {}
  filename = data.get('name', 'bot.py')
  content = data.get('content', '')

  if filename.endswith('.py'):
    try:
      compile(content, filename, 'exec')
      return jsonify({"valid": True, "message": "Código Python 100% válido e livre de erros de sintaxe!"})
    except SyntaxError as e:
      return jsonify({
        "valid": False,
        "error": f"Linha {e.lineno}: {e.msg}",
        "line": e.lineno,
        "offset": e.offset,
        "text": e.text
      }), 400
  elif filename.endswith('.json'):
    try:
      json.loads(content)
      return jsonify({"valid": True, "message": "Estrutura JSON válida!"})
    except Exception as e:
      return jsonify({"valid": False, "error": str(e)}), 400

  return jsonify({"valid": True, "message": "Arquivo de texto válido."})

@app.route('/api/bot/settings', methods=['GET', 'POST'])
def bot_settings_endpoint():
  """
  Lê ou atualiza as configurações do robô (token, mensagens, chave PIX, etc).
  Persiste em bot_settings.json e sincroniza com o ambiente.
  """
  if request.method == 'POST':
    data = request.json or {}
    updated = save_bot_settings(data)
    if 'telegramToken' in data and data['telegramToken']:
      os.environ['TELEGRAM_BOT_TOKEN'] = data['telegramToken'].strip()
    return jsonify({"success": True, "settings": updated})
  return jsonify(load_bot_settings())

@app.route('/api/bot/broadcast', methods=['POST'])
def send_broadcast():
  """Dispara mensagem em massa para todos os inscritos cadastrados."""
  data = request.json or {}
  message_text = data.get("message", "").strip()
  target = data.get("target", "all")

  if not message_text:
    return jsonify({"success": False, "error": "Texto da mensagem não informado"}), 400

  result = broadcast_message_to_subscribers(message_text, target)
  return jsonify(result)

# ─────────────────────────────────────────────────────────────
# 2. MÉTRICAS E DASHBOARD
# ─────────────────────────────────────────────────────────────

@app.route('/api/stats', methods=['GET'])
def get_stats():
  """Retorna estatísticas consolidadas para o painel de controle."""
  session = get_session()
  try:
    total_users = session.query(User).count()
    premium_users = session.query(User).filter_by(is_premium=True).count()
    total_contents = session.query(Content).count()
    
    paid_orders = session.query(Order).filter_by(status='pago').all()
    total_revenue = sum(o.amount for o in paid_orders)
    
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    posts_today = session.query(ScheduledPost).filter(
      ScheduledPost.status == 'publicada',
      ScheduledPost.sent_at >= today_start
    ).count()

    scheduled_pending = session.query(ScheduledPost).filter_by(status='agendada').count()

    return jsonify({
      "users": total_users,
      "premium": premium_users,
      "contents": total_contents,
      "revenue": round(total_revenue, 2),
      "posts_today": posts_today,
      "scheduled_pending": scheduled_pending
    })
  finally:
    session.close()

# ─────────────────────────────────────────────────────────────
# 3. GESTÃO DE CONTEÚDOS & PUBLICAÇÕES
# ─────────────────────────────────────────────────────────────

@app.route('/api/contents', methods=['GET', 'POST'])
def handle_contents():
  session = get_session()
  try:
    if request.method == 'POST':
      data = request.json or request.form
      content = Content(
        title=data.get('title'),
        type=data.get('type', 'video'),
        media_url=data.get('media_url', ''),
        description=data.get('description', ''),
        category=data.get('category', 'Geral'),
        is_premium=bool(data.get('is_premium', False)),
        duration=data.get('duration', ''),
        created_at=datetime.utcnow()
      )
      session.add(content)
      session.commit()

      publish_mode = data.get('publish_mode', 'draft')
      channel_id = os.getenv("TELEGRAM_CHANNEL_ID", "@seucanalpublico")

      if publish_mode == 'schedule':
        schedule_time = datetime.fromisoformat(data.get('scheduled_for'))
        post = ScheduledPost(
          content_id=content.id,
          scheduled_for=schedule_time,
          status='agendada',
          target=data.get('target', 'channel')
        )
        session.add(post)
        session.commit()
      elif publish_mode == 'now':
        post = ScheduledPost(
          content_id=content.id,
          scheduled_for=datetime.utcnow(),
          status='publicada',
          sent_at=datetime.utcnow(),
          target=data.get('target', 'channel')
        )
        session.add(post)
        session.commit()

        # Se houver bot ativo e canal configurado, envia na hora
        if bot and channel_id:
          try:
            caption = (
              f"🔥 <b>NOVO CONTEÚDO DISPONÍVEL!</b>\n\n"
              f"📌 <b>{content.title}</b>\n\n"
              f"{content.description}\n\n"
              f"📁 Categoria: #{content.category}"
            )
            bot.send_message(channel_id, caption)
          except Exception as send_err:
            print(f"⚠️ [CANAL] Aviso ao enviar post instantâneo: {send_err}")

      return jsonify({"success": True, "id": content.id})

    contents = session.query(Content).order_by(Content.created_at.desc()).all()
    return jsonify([{
      "id": c.id,
      "title": c.title,
      "type": c.type,
      "media_url": c.media_url,
      "description": c.description,
      "category": c.category,
      "is_premium": c.is_premium,
      "duration": c.duration,
      "views_count": c.views_count,
      "created_at": c.created_at.isoformat()
    } for c in contents])
  finally:
    session.close()

@app.route('/api/contents/<int:content_id>', methods=['DELETE'])
def delete_content(content_id):
  session = get_session()
  try:
    content = session.query(Content).filter_by(id=content_id).first()
    if not content:
      return jsonify({"error": "Conteúdo não encontrado"}), 404
    session.delete(content)
    session.commit()
    return jsonify({"success": True})
  finally:
    session.close()

# ─────────────────────────────────────────────────────────────
# 4. GESTÃO DE USUÁRIOS & CRM
# ─────────────────────────────────────────────────────────────

@app.route('/api/users', methods=['GET'])
def list_users():
  session = get_session()
  try:
    users = session.query(User).order_by(User.last_interaction.desc()).all()
    return jsonify([{
      "id": u.id,
      "telegram_id": u.telegram_id,
      "username": u.username,
      "first_name": u.first_name,
      "is_premium": u.is_premium,
      "joined_at": u.joined_at.isoformat(),
      "last_interaction": u.last_interaction.isoformat(),
      "purchases_count": u.purchases_count
    } for u in users])
  finally:
    session.close()

@app.route('/api/users/<int:user_id>/toggle-premium', methods=['POST'])
def toggle_user_premium(user_id):
  session = get_session()
  try:
    user = session.query(User).filter_by(id=user_id).first()
    if not user:
      return jsonify({"error": "Usuário não encontrado"}), 404
    user.is_premium = not user.is_premium
    session.commit()

    # Notifica o usuário pelo bot caso tenha sido promovido
    if user.is_premium and bot:
      try:
        bot.send_message(
          user.telegram_id,
          "🎉 <b>PARABÉNS!</b> Seu acesso <b>VIP / PREMIUM</b> foi ativado pelo administrador!"
        )
      except Exception:
        pass

    return jsonify({"success": True, "is_premium": user.is_premium})
  finally:
    session.close()

# ─────────────────────────────────────────────────────────────
# 5. CATÁLOGO DE PRODUTOS & PEDIDOS
# ─────────────────────────────────────────────────────────────

@app.route('/api/products', methods=['GET', 'POST'])
def handle_products():
  session = get_session()
  try:
    if request.method == 'POST':
      data = request.json or {}
      product = Product(
        name=data.get('name'),
        price=float(data.get('price', 0.0)),
        type=data.get('type', 'pack'),
        description=data.get('description', ''),
        active=bool(data.get('active', True))
      )
      session.add(product)
      session.commit()
      return jsonify({"success": True, "id": product.id})

    products = session.query(Product).all()
    return jsonify([{
      "id": p.id,
      "name": p.name,
      "price": p.price,
      "type": p.type,
      "description": p.description,
      "active": p.active
    } for p in products])
  finally:
    session.close()

@app.route('/api/orders', methods=['GET'])
def list_orders():
  session = get_session()
  try:
    orders = session.query(Order).order_by(Order.created_at.desc()).all()
    return jsonify([{
      "id": o.id,
      "user_id": o.user_id,
      "user_name": o.user.first_name if o.user else "Desconhecido",
      "product_id": o.product_id,
      "amount": o.amount,
      "status": o.status,
      "payment_method": o.payment_method,
      "created_at": o.created_at.isoformat()
    } for o in orders])
  finally:
    session.close()

@app.route('/api/orders/<int:order_id>/approve', methods=['POST'])
def approve_order(order_id):
  session = get_session()
  try:
    order = session.query(Order).filter_by(id=order_id).first()
    if not order:
      return jsonify({"error": "Pedido não encontrado"}), 404
    order.status = "pago"
    if order.user:
      order.user.is_premium = True
      order.user.purchases_count += 1
    session.commit()
    return jsonify({"success": True})
  finally:
    session.close()

# ─────────────────────────────────────────────────────────────
# 6. INICIALIZAÇÃO
# ─────────────────────────────────────────────────────────────

if __name__ == '__main__':
  port = int(os.getenv('PORT', 5000))
  print(f"🚀 [CONTENT OS] Painel Flask rodando em http://0.0.0.0:{port}")
  app.run(host='0.0.0.0', port=port, debug=True)
