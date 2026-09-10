"""
CONTENT OS - TELEGRAM BOT SUPERVISIONADO (24/7 AUTO-RECOVERY)
Bot de distribuição, vendas e monetização de conteúdo no Telegram.
Desenvolvido com pyTelegramBotAPI (telebot), SQLAlchemy e SQLite.
Garante conexão contínua, identificação do bot pelo token e recuperação automática de quedas.
"""

import os
import sys
import time
import telebot
from telebot import types
from datetime import datetime
from dotenv import load_dotenv

# Importa modelos e banco de dados do painel
from models import init_db, get_session, User, Content, Product, Order, ScheduledPost

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
INSTAGRAM_URL = os.getenv("INSTAGRAM_URL", "https://instagram.com/seuperfil")
SUPPORT_USERNAME = os.getenv("SUPPORT_USERNAME", "suporte_contentos").replace("@", "")
CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID", "@seucanalpublico")

# Inicializa banco de dados caso ainda não tenha sido criado
init_db()

# Cria instância do TeleBot
bot = telebot.TeleBot(BOT_TOKEN, parse_mode="HTML") if BOT_TOKEN else None

bot_info_cache = None

def verify_and_identify_bot():
  """
  Verifica o token recebido, conecta à API do Telegram e identifica o nome e username do bot.
  Retorna as informações do bot ou gera logs descritivos para correção.
  """
  global bot, bot_info_cache
  token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
  
  if not token or token == "SEU_TELEGRAM_BOT_TOKEN_AQUI" or "123456789:" in token:
    print("\n" + "═"*70)
    print("⚠️  [CONTENT OS - TOKEN AUSENTE OU PADRÃO]")
    print("   Nenhum token válido encontrado no arquivo .env!")
    print("   Para conectar seu bot real:")
    print("   1. Acesse o @BotFather no Telegram")
    print("   2. Crie seu bot ou copie o token HTTP API")
    print("   3. Defina TELEGRAM_BOT_TOKEN no seu arquivo .env ou no Painel Web")
    print("═"*70 + "\n")
    return None

  try:
    if not bot:
      bot = telebot.TeleBot(token, parse_mode="HTML")
    
    print("📡 [TELEGRAM BOT] Conectando à API do Telegram e validando token...")
    me = bot.get_me()
    bot_info_cache = me

    print("\n" + "╔" + "═"*68 + "╗")
    print(f"║ 🤖 [TELEGRAM BOT CONECTADO COM SUCESSO!]".ljust(69) + "║")
    print("╠" + "═"*68 + "╣")
    print(f"║ • Nome do Bot:      {me.first_name}".ljust(69) + "║")
    print(f"║ • Username:         @{me.username}".ljust(69) + "║")
    print(f"║ • Bot ID:           {me.id}".ljust(69) + "║")
    print(f"║ • Link Direto:      https://t.me/{me.username}".ljust(69) + "║")
    print(f"║ • Status da Conta:  ONLINE & PRONTO PARA AUTOMAÇÃO".ljust(69) + "║")
    print(f"║ • Supervisão 24/7:  ATIVA (Auto-restart contra quedas)".ljust(69) + "║")
    print("╚" + "═"*68 + "╝\n")

    return me
  except telebot.apihelper.ApiTelegramException as api_err:
    print("\n" + "═"*70)
    print(f"❌ [ERRO DE AUTENTICAÇÃO DO BOT] O token fornecido foi recusado pelo Telegram:")
    print(f"   Código de erro: {api_err.error_code} - {api_err.description}")
    print("   Verifique se o token foi digitado corretamente sem espaços extras.")
    print("═"*70 + "\n")
    return None
  except Exception as e:
    print(f"❌ [ERRO DE CONEXÃO DO BOT] Falha ao contatar Telegram: {str(e)}")
    return None

def get_or_create_user(message_or_call):
  """Registra automaticamente o usuário no banco de dados SQLite."""
  from_user = message_or_call.from_user
  session = get_session()
  try:
    user = session.query(User).filter_by(telegram_id=from_user.id).first()
    if not user:
      user = User(
        telegram_id=from_user.id,
        username=from_user.username or f"user_{from_user.id}",
        first_name=from_user.first_name or "Visitante",
        is_premium=False,
        joined_at=datetime.utcnow(),
        last_interaction=datetime.utcnow()
      )
      session.add(user)
      session.commit()
      print(f"👤 [NOVO ASSINANTE] {user.first_name} (@{user.username} | ID: {user.telegram_id}) registrado no banco!")
    else:
      user.last_interaction = datetime.utcnow()
      if from_user.username and user.username != from_user.username:
        user.username = from_user.username
      if from_user.first_name and user.first_name != from_user.first_name:
        user.first_name = from_user.first_name
      session.commit()
    return user
  finally:
    session.close()

# ─────────────────────────────────────────────────────────────
# 1. COMANDO /start E FLUXO DE ENTRADA (COM CTA DO INSTAGRAM)
# ─────────────────────────────────────────────────────────────

if bot:
  @bot.message_handler(commands=['start'])
  def send_welcome(message):
    user = get_or_create_user(message)
    
    text = (
      f"👋 <b>Olá, {user.first_name}! Seja muito bem-vindo(a).</b>\n\n"
      "Este é o canal oficial de conteúdos, treinamentos e automações exclusivas!\n\n"
      "📸 <b>Passo Obrigatório:</b>\n"
      "<i>Siga nosso Instagram para acompanhar bastidores, códigos diários e novidades em primeira mão:</i>"
    )
    
    markup = types.InlineKeyboardMarkup(row_width=1)
    btn_insta = types.InlineKeyboardButton("📸 SEGUIR NO INSTAGRAM", url=INSTAGRAM_URL)
    btn_confirm = types.InlineKeyboardButton("✅ JÁ SIGO / CONTINUAR 🚀", callback_data="menu_principal")
    markup.add(btn_insta, btn_confirm)
    
    bot.send_message(message.chat.id, text, reply_markup=markup)

  @bot.message_handler(commands=['menu'])
  def cmd_menu(message):
    user = get_or_create_user(message)
    badge = "💎 MEMBRO VIP / PREMIUM" if user.is_premium else "🆓 ACESSO GRATUITO"
    
    text = (
      f"🤖 <b>CONTENT OS - HUB PRINCIPAL</b>\n"
      f"Status: <b>{badge}</b>\n\n"
      f"Olá, {user.first_name}! 👋\n"
      f"Escolha uma das opções abaixo para navegar:"
    )
    bot.send_message(message.chat.id, text, reply_markup=get_main_menu_markup())

  @bot.message_handler(commands=['status', 'ping'])
  def cmd_status(message):
    get_or_create_user(message)
    session = get_session()
    try:
      total_users = session.query(User).count()
      total_contents = session.query(Content).count()
      text = (
        "🟢 <b>STATUS DO SISTEMA & TELEBOT</b>\n"
        "────────────────────\n"
        "• <b>Status:</b> 100% Online & Operacional\n"
        "• <b>Supervisão:</b> Ativa 24/7 com Auto-Restart\n"
        "• <b>Servidor Flask:</b> Conectado à API local\n"
        f"• <b>Assinantes no Banco:</b> {total_users}\n"
        f"• <b>Conteúdos Cadastrados:</b> {total_contents}\n"
        f"• <b>Horário UTC:</b> {datetime.utcnow().strftime('%d/%m/%Y %H:%M:%S')}"
      )
      bot.send_message(message.chat.id, text)
    finally:
      session.close()

  # ─────────────────────────────────────────────────────────────
  # 2. MENU PRINCIPAL INTERATIVO
  # ─────────────────────────────────────────────────────────────

  def get_main_menu_markup():
    markup = types.InlineKeyboardMarkup(row_width=2)
    btn1 = types.InlineKeyboardButton("📚 Conteúdos", callback_data="btn_conteudos")
    btn2 = types.InlineKeyboardButton("🔥 Novidades", callback_data="btn_novidades")
    btn3 = types.InlineKeyboardButton("💎 Área Premium", callback_data="btn_premium")
    btn4 = types.InlineKeyboardButton("🛒 Comprar Conteúdo", callback_data="btn_comprar")
    btn5 = types.InlineKeyboardButton("👤 Meu Perfil", callback_data="btn_perfil")
    btn6 = types.InlineKeyboardButton("❓ Suporte", callback_data="btn_suporte")
    markup.add(btn1, btn2)
    markup.add(btn3, btn4)
    markup.add(btn5, btn6)
    return markup

  @bot.callback_query_handler(func=lambda call: call.data == "menu_principal")
  def show_main_menu(call):
    user = get_or_create_user(call)
    badge = "💎 MEMBRO VIP" if user.is_premium else "🆓 ACESSO GRATUITO"
    
    text = (
      f"🤖 <b>CONTENT OS HUB</b>\n"
      f"Status: <b>{badge}</b>\n\n"
      f"Olá, {user.first_name}! 👋\n"
      f"O que você deseja explorar hoje no nosso hub?"
    )
    try:
      bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=get_main_menu_markup())
    except Exception:
      bot.send_message(call.message.chat.id, text, reply_markup=get_main_menu_markup())

  # ─────────────────────────────────────────────────────────────
  # 3. NAVEGAÇÃO DE CONTEÚDOS & CATEGORIAS
  # ─────────────────────────────────────────────────────────────

  @bot.callback_query_handler(func=lambda call: call.data == "btn_conteudos")
  def show_categories(call):
    session = get_session()
    try:
      # Busca categorias reais presentes no banco
      db_categories = session.query(Content.category).distinct().all()
      categories = [c[0] for c in db_categories if c[0]]
      if not categories:
        categories = ["Python", "IA", "Automação", "Marketing", "SaaS"]

      markup = types.InlineKeyboardMarkup(row_width=2)
      buttons = [types.InlineKeyboardButton(f"📁 {cat}", callback_data=f"cat_{cat}") for cat in categories]
      markup.add(*buttons)
      markup.add(types.InlineKeyboardButton("⬅️ Voltar ao Menu", callback_data="menu_principal"))
      
      text = "📚 <b>EXPLORADOR DE CONTEÚDOS</b>\n\nEscolha uma categoria para listar aulas, materiais e packs disponíveis:"
      bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=markup)
    finally:
      session.close()

  @bot.callback_query_handler(func=lambda call: call.data.startswith("cat_"))
  def show_contents_in_category(call):
    category = call.data.replace("cat_", "")
    session = get_session()
    try:
      contents = session.query(Content).filter_by(category=category).limit(8).all()
      if not contents:
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("⬅️ Outras Categorias", callback_data="btn_conteudos"))
        bot.edit_message_text(f"Nenhum conteúdo encontrado para <b>{category}</b> no momento.", call.message.chat.id, call.message.message_id, reply_markup=markup)
        return

      markup = types.InlineKeyboardMarkup(row_width=1)
      for item in contents:
        lock = "💎 " if item.is_premium else "🔓 "
        btn_text = f"{lock}{item.title} ({item.type})"
        markup.add(types.InlineKeyboardButton(btn_text, callback_data=f"view_content_{item.id}"))
      markup.add(types.InlineKeyboardButton("⬅️ Voltar às Categorias", callback_data="btn_conteudos"))

      bot.edit_message_text(f"📁 Categoria: <b>{category}</b>\nSelecione um conteúdo para ver detalhes:", call.message.chat.id, call.message.message_id, reply_markup=markup)
    finally:
      session.close()

  @bot.callback_query_handler(func=lambda call: call.data == "btn_novidades")
  def show_latest_contents(call):
    session = get_session()
    try:
      contents = session.query(Content).order_by(Content.created_at.desc()).limit(5).all()
      markup = types.InlineKeyboardMarkup(row_width=1)
      for item in contents:
        lock = "💎 " if item.is_premium else "🔓 "
        markup.add(types.InlineKeyboardButton(f"{lock}{item.title}", callback_data=f"view_content_{item.id}"))
      markup.add(types.InlineKeyboardButton("⬅️ Voltar ao Menu", callback_data="menu_principal"))

      text = "🔥 <b>ÚLTIMOS LANÇAMENTOS & NOVIDADES</b>\n\nAqui estão as publicações mais recentes adicionadas ao Hub:"
      bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=markup)
    finally:
      session.close()

  @bot.callback_query_handler(func=lambda call: call.data.startswith("view_content_"))
  def view_content(call):
    content_id = int(call.data.replace("view_content_", ""))
    user = get_or_create_user(call)
    session = get_session()
    try:
      item = session.query(Content).filter_by(id=content_id).first()
      if not item:
        bot.answer_callback_query(call.id, "Conteúdo não encontrado!")
        return

      # Se for premium e usuário não for premium: BLOQUEIA!
      if item.is_premium and not user.is_premium:
        paywall_text = (
          f"🔒 <b>CONTEÚDO EXCLUSIVO PARA MEMBROS PREMIUM</b>\n\n"
          f"📌 <b>{item.title}</b>\n"
          f"{item.description}\n\n"
          "⚡ Para assistir a esta aula e acessar todos os packs e códigos, assine nosso plano Premium ou adquira o conteúdo avulso!"
        )
        markup = types.InlineKeyboardMarkup(row_width=1)
        markup.add(types.InlineKeyboardButton("🔓 ASSINAR PREMIUM (R$ 29,90/mês)", callback_data="checkout_premium"))
        markup.add(types.InlineKeyboardButton("🛒 COMPRAR ESTE CONTEÚDO AVULSO", callback_data="btn_comprar"))
        markup.add(types.InlineKeyboardButton("⬅️ Voltar aos Conteúdos", callback_data="btn_conteudos"))
        bot.edit_message_text(paywall_text, call.message.chat.id, call.message.message_id, reply_markup=markup)
        return

      # Conteúdo liberado!
      item.views_count += 1
      session.commit()

      caption = (
        f"🎓 <b>{item.title}</b>\n\n"
        f"{item.description}\n\n"
        f"📁 <b>Categoria:</b> {item.category} | <b>Tipo:</b> {item.type.capitalize()}\n"
        f"⏱ <b>Duração:</b> {item.duration or 'Completo'}\n"
        f"👁 <b>Visualizações:</b> {item.views_count}"
      )
      markup = types.InlineKeyboardMarkup(row_width=2)
      markup.add(
        types.InlineKeyboardButton("▶️ ACESSAR AGORA", url=item.media_url or "https://t.me"),
        types.InlineKeyboardButton("⬅️ Outros", callback_data="btn_conteudos")
      )
      bot.send_message(call.message.chat.id, caption, reply_markup=markup)
      bot.answer_callback_query(call.id, "Conteúdo liberado com sucesso!")
    finally:
      session.close()

  # ─────────────────────────────────────────────────────────────
  # 4. PRODUTOS, VENDAS & PAGAMENTOS PIX
  # ─────────────────────────────────────────────────────────────

  @bot.callback_query_handler(func=lambda call: call.data in ["btn_comprar", "checkout_premium", "btn_premium"])
  def list_products_to_buy(call):
    session = get_session()
    try:
      products = session.query(Product).filter_by(active=True).all()
      markup = types.InlineKeyboardMarkup(row_width=1)
      for prod in products:
        markup.add(types.InlineKeyboardButton(f"💳 {prod.name} - R$ {prod.price:.2f}", callback_data=f"buy_prod_{prod.id}"))
      markup.add(types.InlineKeyboardButton("⬅️ Voltar ao Menu", callback_data="menu_principal"))
      
      text = (
        "🛒 <b>CATÁLOGO DE PRODUTOS & ASSINATURAS VIP</b>\n\n"
        "Selecione um produto para gerar a chave PIX e liberar seu acesso instantaneamente:"
      )
      bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=markup)
    finally:
      session.close()

  @bot.callback_query_handler(func=lambda call: call.data.startswith("buy_prod_"))
  def process_purchase(call):
    prod_id = int(call.data.replace("buy_prod_", ""))
    user = get_or_create_user(call)
    session = get_session()
    try:
      prod = session.query(Product).filter_by(id=prod_id).first()
      if not prod:
        bot.answer_callback_query(call.id, "Produto indisponível!")
        return

      order = Order(
        user_id=user.id,
        product_id=prod.id,
        amount=prod.price,
        status="pendente",
        payment_method="PIX",
        created_at=datetime.utcnow()
      )
      session.add(order)
      session.commit()

      pix_mock_code = f"00020126580014br.gov.bcb.pix0136contentos_{order.id}_pay5204000053039865405{prod.price:.2f}5802BR5920ContentOS_Hub6009Sao_Paulo"
      
      text = (
        f"💳 <b>PEDIDO #{order.id} GERADO COM SUCESSO</b>\n\n"
        f"📦 Produto: <b>{prod.name}</b>\n"
        f"💰 Valor: <b>R$ {prod.price:.2f}</b>\n\n"
        f"⚡ <b>Código PIX Copia e Cola:</b>\n"
        f"<code>{pix_mock_code}</code>\n\n"
        "<i>Após o pagamento no seu banco, clique no botão de verificação abaixo para liberar seu acesso imediatamente:</i>"
      )
      markup = types.InlineKeyboardMarkup(row_width=1)
      markup.add(types.InlineKeyboardButton("✅ CONFIRMAR PAGAMENTO (LIBERAR VIP)", callback_data=f"sim_pay_{order.id}"))
      markup.add(types.InlineKeyboardButton("⬅️ Cancelar e Voltar", callback_data="menu_principal"))
      
      bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=markup)
    finally:
      session.close()

  @bot.callback_query_handler(func=lambda call: call.data.startswith("sim_pay_"))
  def simulate_payment_approval(call):
    order_id = int(call.data.replace("sim_pay_", ""))
    session = get_session()
    try:
      order = session.query(Order).filter_by(id=order_id).first()
      if not order:
        bot.answer_callback_query(call.id, "Pedido não encontrado!")
        return
      
      order.status = "pago"
      user = session.query(User).filter_by(id=order.user_id).first()
      if user:
        user.is_premium = True
        user.purchases_count += 1
        session.commit()
      
      text = (
        "🎉 <b>PAGAMENTO CONFIRMADO COM SUCESSO!</b>\n\n"
        f"Parabéns, {user.first_name}! Seu status foi atualizado para <b>MEMBRO VIP 💎</b>.\n\n"
        "Todos os conteúdos exclusivos, códigos e materiais estão 100% liberados para você!\n"
        "Acesse o menu principal abaixo para começar:"
      )
      bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=get_main_menu_markup())
      bot.answer_callback_query(call.id, "Acesso VIP liberado com sucesso!", show_alert=True)
      print(f"💰 [VENDA CONCLUÍDA] Pedido #{order.id} aprovado para {user.first_name} (R$ {order.amount:.2f})")
    finally:
      session.close()

  # ─────────────────────────────────────────────────────────────
  # 5. PERFIL & SUPORTE
  # ─────────────────────────────────────────────────────────────

  @bot.callback_query_handler(func=lambda call: call.data == "btn_perfil")
  def show_user_profile(call):
    user = get_or_create_user(call)
    status_str = "MEMBRO VIP 💎" if user.is_premium else "Visitante Gratuito 🆓"
    
    text = (
      "👤 <b>MEU PERFIL NO HUB</b>\n"
      "────────────────────\n"
      f"<b>ID Telegram:</b> <code>{user.telegram_id}</code>\n"
      f"<b>Username:</b> @{user.username}\n"
      f"<b>Nome:</b> {user.first_name}\n"
      f"<b>Cadastrado em:</b> {user.joined_at.strftime('%d/%m/%Y %H:%M')}\n"
      f"<b>Plano Atual:</b> {status_str}\n"
      f"<b>Compras Realizadas:</b> {user.purchases_count}\n"
      f"<b>Última Atividade:</b> Agora mesmo"
    )
    markup = types.InlineKeyboardMarkup(row_width=1)
    if not user.is_premium:
      markup.add(types.InlineKeyboardButton("💎 Fazer Upgrade para VIP", callback_data="checkout_premium"))
    markup.add(types.InlineKeyboardButton("⬅️ Voltar ao Menu", callback_data="menu_principal"))
    bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=markup)

  @bot.callback_query_handler(func=lambda call: call.data == "btn_suporte")
  def show_support(call):
    text = (
      "❓ <b>CENTRAL DE SUPORTE</b>\n\n"
      "Dúvidas sobre conteúdos, liberação de acesso ou parcerias?\n\n"
      f"Fale diretamente com nossa equipe de atendimento:\n"
      f"👉 @{SUPPORT_USERNAME}"
    )
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("💬 Abrir Conversa com Suporte", url=f"https://t.me/{SUPPORT_USERNAME}"))
    markup.add(types.InlineKeyboardButton("⬅️ Voltar ao Menu", callback_data="menu_principal"))
    bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=markup)

  # Fallback para mensagens de texto comuns
  @bot.message_handler(func=lambda message: True)
  def handle_all_messages(message):
    user = get_or_create_user(message)
    text = (
      f"Olá, {user.first_name}! 👋\n"
      "Recebi sua mensagem. Utilize o botão abaixo para abrir o menu de conteúdos e recursos:"
    )
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("📱 ABRIR MENU PRINCIPAL", callback_data="menu_principal"))
    bot.reply_to(message, text, reply_markup=markup)

# ─────────────────────────────────────────────────────────────
# 6. FUNÇÃO DE BROADCAST (TRANSMISSÃO EM MASSA)
# ─────────────────────────────────────────────────────────────

def broadcast_message_to_subscribers(message_text, target="all"):
  """Envia uma notificação para todos os usuários cadastrados no banco de dados."""
  if not bot:
    return {"success": False, "error": "Bot não inicializado"}
  
  session = get_session()
  sent_count = 0
  failed_count = 0
  try:
    query = session.query(User)
    if target == "premium":
      query = query.filter_by(is_premium=True)
    elif target == "free":
      query = query.filter_by(is_premium=False)
    
    users = query.all()
    for u in users:
      try:
        bot.send_message(u.telegram_id, message_text)
        sent_count += 1
        time.sleep(0.04) # Previne rate limit do Telegram (30 msg/s)
      except Exception:
        failed_count += 1
    
    return {
      "success": True,
      "total": len(users),
      "sent": sent_count,
      "failed": failed_count
    }
  finally:
    session.close()

# ─────────────────────────────────────────────────────────────
# 7. SUPERVISOR 24/7 (NÃO DEIXA O BOT PARAR)
# ─────────────────────────────────────────────────────────────

def run_bot_forever():
  """
  Loop infinito com auto-restart e recuperação automática.
  Garante que o bot nunca pare mesmo com oscilações de rede, quedas de DNS
  ou erros transitórios da API do Telegram.
  """
  global bot
  consecutive_failures = 0

  while True:
    try:
      bot_info = verify_and_identify_bot()
      if not bot_info:
        print("⏳ [SUPERVISOR] Aguardando configuração do token... Tentando novamente em 15s...")
        time.sleep(15)
        continue

      print(f"🚀 [SUPERVISOR] Iniciando polling contínuo para @{bot_info.username}...")
      consecutive_failures = 0
      
      # infinity_polling com timeout para manter a conexão viva
      bot.infinity_polling(timeout=20, long_polling_timeout=20, skip_pending=True)

    except (telebot.apihelper.ApiTelegramException, Exception) as err:
      consecutive_failures += 1
      sleep_time = min(consecutive_failures * 3, 30)
      print(f"\n⚠️  [SUPERVISOR - QUEDA DETECTADA]")
      print(f"    Erro: {str(err)}")
      print(f"    🔁 Auto-restart acionado! Reconectando em {sleep_time} segundos (Tentativa #{consecutive_failures})...\n")
      time.sleep(sleep_time)

if __name__ == "__main__":
  run_bot_forever()
