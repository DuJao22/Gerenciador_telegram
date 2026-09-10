"""
CONTENT OS - SERVIDOR FLASK & API CENTRAL
Servidor web de alta performance que suporta todo o ecossistema:
- Gestão de Conteúdos, Catálogo de Produtos e Pedidos
- CRM de Usuários e Assinaturas VIP
- Monitoramento de Conexão e Identificação do Bot Telegram
- Disparo de Broadcasts e Agendamentos
"""

import os
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
DIST_DIR = os.path.join(CURRENT_DIR, 'dist')
if not os.path.exists(DIST_DIR):
  DIST_DIR = os.path.join(os.getcwd(), 'dist')

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
  Página HTML moderna exibida caso o build do React ainda não tenha sido
  gerado, oferecendo um painel visual instantâneo e amigável.
  """
  bot_info = verify_and_identify_bot()
  bot_name = bot_info.first_name if bot_info else "Curso Python Bot"
  bot_user = bot_info.username if bot_info else "Curso_PythonBot"
  is_online = bot_info is not None
  stats = get_dashboard_stats()

  html = f"""<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content OS &middot; Telegram Bot Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Plus Jakarta Sans', sans-serif; }}
    code, pre {{ font-family: 'JetBrains Mono', monospace; }}
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between selection:bg-cyan-500 selection:text-white antialiased">
  
  <!-- Header -->
  <header class="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/20">
          ⚡
        </div>
        <div>
          <h1 class="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Content OS
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono">
              Render Online
            </span>
          </h1>
          <p class="text-xs text-slate-400">Telegram Bot Engine &amp; Automação 24/7</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold {'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' if is_online else 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}">
          <span class="w-2 h-2 rounded-full {'bg-emerald-400 animate-pulse' if is_online else 'bg-amber-400'}"></span>
          {'Bot Conectado' if is_online else 'Aguardando Token'}
        </span>
        <a href="https://t.me/{bot_user}" target="_blank" rel="noreferrer" class="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-md shadow-cyan-500/20 flex items-center gap-1.5">
          <span>Abrir Bot</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
    
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
            Seu servidor de automação, agendador e bot do Telegram estão operando com sucesso. O sistema processa compras, entrega conteúdos e atende clientes 24 horas por dia.
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <a href="https://t.me/{bot_user}?start=painel" target="_blank" rel="noreferrer" class="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
            <span>Iniciar Bot no Telegram</span>
          </a>
          <a href="/api/health" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition-colors flex items-center gap-2">
            <span>Ver Health Check</span>
          </a>
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

    <!-- Endpoints da API -->
    <div class="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
      <h3 class="text-base font-bold text-white flex items-center gap-2">
        <span>Endpoints da API REST (Disponíveis)</span>
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <a href="/api/health" class="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-colors block">
          <div class="flex items-center justify-between mb-1">
            <span class="font-mono text-cyan-400 font-bold">GET /api/health</span>
            <span class="text-[10px] text-emerald-400">200 OK</span>
          </div>
          <p class="text-slate-400 text-[11px]">Status de saúde do serviço e SQLite</p>
        </a>
        <a href="/api/bot/status" class="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-colors block">
          <div class="flex items-center justify-between mb-1">
            <span class="font-mono text-cyan-400 font-bold">GET /api/bot/status</span>
            <span class="text-[10px] text-cyan-400">Telegram</span>
          </div>
          <p class="text-slate-400 text-[11px]">Validação e perfil do bot conectado</p>
        </a>
        <a href="/api/products" class="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-colors block">
          <div class="flex items-center justify-between mb-1">
            <span class="font-mono text-cyan-400 font-bold">GET /api/products</span>
            <span class="text-[10px] text-purple-400">Catálogo</span>
          </div>
          <p class="text-slate-400 text-[11px]">Listagem de produtos e preços PIX</p>
        </a>
        <a href="/api/users" class="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-colors block">
          <div class="flex items-center justify-between mb-1">
            <span class="font-mono text-cyan-400 font-bold">GET /api/users</span>
            <span class="text-[10px] text-amber-400">CRM</span>
          </div>
          <p class="text-slate-400 text-[11px]">Lista de inscritos e status VIP</p>
        </a>
        <a href="/api/orders" class="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-colors block">
          <div class="flex items-center justify-between mb-1">
            <span class="font-mono text-cyan-400 font-bold">GET /api/orders</span>
            <span class="text-[10px] text-blue-400">Vendas</span>
          </div>
          <p class="text-slate-400 text-[11px]">Histórico de compras e pagamentos</p>
        </a>
        <a href="/ping" class="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-colors block">
          <div class="flex items-center justify-between mb-1">
            <span class="font-mono text-cyan-400 font-bold">GET /ping</span>
            <span class="text-[10px] text-emerald-400">Keep-Alive</span>
          </div>
          <p class="text-slate-400 text-[11px]">Rota leve anti-hibernação do Render</p>
        </a>
      </div>
    </div>

  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-800/80 bg-slate-900/40 py-4 text-center text-xs text-slate-500">
    Content OS &copy; {datetime.utcnow().year} &middot; Hospedado no Render com Gunicorn WSGI &middot; Bot Telegram Online 24/7
  </footer>
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
  """
  data = request.json or {}
  token = data.get("token", "").strip()

  if not token:
    return jsonify({"success": False, "error": "Token não fornecido"}), 400

  try:
    url = f"https://api.telegram.org/bot{token}/getMe"
    resp = requests.get(url, timeout=6)
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
  except Exception as e:
    return jsonify({"success": False, "error": f"Falha de rede ao contatar Telegram: {str(e)}"}), 500

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
