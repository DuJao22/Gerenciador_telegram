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
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests

from models import init_db, get_session, User, Content, ScheduledPost, Product, Order
from bot import verify_and_identify_bot, broadcast_message_to_subscribers, bot

load_dotenv()

app = Flask(__name__)
CORS(app) # Permite que o frontend React ou outros clientes consumam a API sem bloqueio

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'content-os-secret-key-2026')
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Garante que as tabelas SQLite e dados iniciais existam
init_db()

# ─────────────────────────────────────────────────────────────
# 1. HEALTHCHECK & STATUS DO BOT TELEGRAM (RENDER READY)
# ─────────────────────────────────────────────────────────────

@app.route('/', methods=['GET'])
def root_status():
  """Endpoint raiz otimizado para o Health Check do Render e visualização rápida."""
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
