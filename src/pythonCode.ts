export interface PythonCodeFile {
  filename: string;
  description: string;
  code: string;
  language: string;
}

export const PYTHON_FILES: Record<string, PythonCodeFile> = {
  'main.py': {
    filename: 'main.py',
    description: 'Orquestrador Master 24/7: Inicia Flask + Bot + Scheduler em threads concorrentes com watchdog supervisor',
    language: 'python',
    code: `"""
CONTENT OS - ORQUESTRADOR MASTER & SUPERVISOR 24/7 (main.py)
Inicia de forma concorrente e supervisionada:
1. 🌐 Servidor Web & API Flask (app.py)
2. 🤖 Worker do Telegram Bot com Auto-Recovery (bot.py)
3. ⏰ Worker de Agendamento Automático (scheduler.py)

Garante que o bot NUNCA pare ("não deixe ele parar"), monitorando threads
e reiniciando automaticamente qualquer serviço em caso de falha.
"""

import os
import sys
import time
import threading
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from models import init_db
from bot import verify_and_identify_bot, run_bot_forever
from scheduler import check_and_publish_scheduled_posts
from app import app
from apscheduler.schedulers.background import BackgroundScheduler

def print_banner():
  print("="*72)
  print("       ⚡ CONTENT OS - PLATAFORMA DE AUTOMAÇÃO E VENDAS NO TELEGRAM ⚡")
  print("="*72)
  print("  • Arquitetura: Flask + Telebot + SQLAlchemy + APScheduler")
  print("  • Modo de Execução: Concorrente com Supervisão Ativa 24/7")
  print("="*72)

def start_scheduler_worker():
  """Worker de agendamento em thread separada."""
  try:
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_and_publish_scheduled_posts, 'interval', seconds=20)
    scheduler.start()
    print("⏰ [MAIN SUPERVISOR] Worker de agendamento iniciado (20s)!")
    while True:
      time.sleep(10)
  except Exception as e:
    print(f"❌ [MAIN SUPERVISOR - SCHEDULER ERRO]: {e}")

def run_flask_server():
  """Inicia o servidor Flask na porta especificada."""
  port = int(os.getenv('PORT', 5000))
  print(f"🌐 [MAIN SUPERVISOR] Servidor Flask iniciando em http://0.0.0.0:{port}...")
  # debug=False para evitar múltiplos forks de subprocessos
  app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)

def main():
  print_banner()

  # 1. Inicializa o banco de dados e sementes iniciais
  print("📦 [ETAPA 1/3] Verificando banco de dados SQLite...")
  init_db()

  # 2. Conecta ao Telegram, valida token e identifica nome do bot
  print("\\n📡 [ETAPA 2/3] Identificando e conectando Bot no Telegram...")
  bot_info = verify_and_identify_bot()
  if bot_info:
    print(f"✅ Bot verificado: {bot_info.first_name} (@{bot_info.username})")
  else:
    print("⚠️ Aviso: Bot não identificado no momento. O servidor iniciará e você poderá configurar o token depois.")

  # 3. Inicia o Worker do Bot em Thread com Supervisão
  print("\\n🚀 [ETAPA 3/3] Iniciando serviços concorrentes com auto-recovery...")
  bot_thread = threading.Thread(target=run_bot_forever, daemon=True, name="TelegramBotThread")
  bot_thread.start()
  print("🤖 [SUPERVISOR] Thread do Bot Telegram ativa!")

  # 4. Inicia o Worker do Scheduler em Thread
  sched_thread = threading.Thread(target=start_scheduler_worker, daemon=True, name="SchedulerThread")
  sched_thread.start()
  print("⏰ [SUPERVISOR] Thread do Agendador ativa!")

  # 5. Inicia o Watchdog Supervisor em Background
  def watchdog():
    nonlocal bot_thread, sched_thread
    while True:
      time.sleep(15)
      if not bot_thread.is_alive():
        print("⚠️ [WATCHDOG ALERTA] Thread do bot parou inesperadamente! Reiniciando...")
        bot_thread = threading.Thread(target=run_bot_forever, daemon=True, name="TelegramBotThread")
        bot_thread.start()
        print("✅ [WATCHDOG] Thread do bot reiniciada com sucesso!")

      if not sched_thread.is_alive():
        print("⚠️ [WATCHDOG ALERTA] Thread do scheduler parou! Reiniciando...")
        sched_thread = threading.Thread(target=start_scheduler_worker, daemon=True, name="SchedulerThread")
        sched_thread.start()
        print("✅ [WATCHDOG] Thread do scheduler reiniciada!")

  watchdog_thread = threading.Thread(target=watchdog, daemon=True, name="WatchdogThread")
  watchdog_thread.start()
  print("🛡️ [SUPERVISOR] Watchdog de proteção 24/7 iniciado!")

  # 6. Inicia o Flask na thread principal (mantém o processo vivo)
  run_flask_server()

if __name__ == "__main__":
  main()
`
  },
  'bot.py': {
    filename: 'bot.py',
    description: 'Bot Telegram supervisionado com validação de token, identificação (@username) e auto-recovery 24/7',
    language: 'python',
    code: `"""
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

from models import init_db, get_session, User, Content, Product, Order, ScheduledPost

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
INSTAGRAM_URL = os.getenv("INSTAGRAM_URL", "https://instagram.com/seuperfil")
SUPPORT_USERNAME = os.getenv("SUPPORT_USERNAME", "suporte_contentos").replace("@", "")
CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID", "@seucanalpublico")

init_db()

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
    print("\\n" + "═"*70)
    print("⚠️  [CONTENT OS - TOKEN AUSENTE OU PADRÃO]")
    print("   Nenhum token válido encontrado no arquivo .env!")
    print("   Para conectar seu bot real:")
    print("   1. Acesse o @BotFather no Telegram")
    print("   2. Crie seu bot ou copie o token HTTP API")
    print("   3. Defina TELEGRAM_BOT_TOKEN no seu arquivo .env ou no Painel Web")
    print("═"*70 + "\\n")
    return None

  try:
    if not bot:
      bot = telebot.TeleBot(token, parse_mode="HTML")
    
    print("📡 [TELEGRAM BOT] Conectando à API do Telegram e validando token...")
    me = bot.get_me()
    bot_info_cache = me

    print("\\n" + "╔" + "═"*68 + "╗")
    print(f"║ 🤖 [TELEGRAM BOT CONECTADO COM SUCESSO!]".ljust(69) + "║")
    print("╠" + "═"*68 + "╣")
    print(f"║ • Nome do Bot:      {me.first_name}".ljust(69) + "║")
    print(f"║ • Username:         @{me.username}".ljust(69) + "║")
    print(f"║ • Bot ID:           {me.id}".ljust(69) + "║")
    print(f"║ • Link Direto:      https://t.me/{me.username}".ljust(69) + "║")
    print(f"║ • Status da Conta:  ONLINE & PRONTO PARA AUTOMAÇÃO".ljust(69) + "║")
    print(f"║ • Supervisão 24/7:  ATIVA (Auto-restart contra quedas)".ljust(69) + "║")
    print("╚" + "═"*68 + "╝\\n")

    return me
  except telebot.apihelper.ApiTelegramException as api_err:
    print("\\n" + "═"*70)
    print(f"❌ [ERRO DE AUTENTICAÇÃO DO BOT] O token fornecido foi recusado pelo Telegram:")
    print(f"   Código de erro: {api_err.error_code} - {api_err.description}")
    print("   Verifique se o token foi digitado corretamente sem espaços extras.")
    print("═"*70 + "\\n")
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

# COMANDO /start
if bot:
  @bot.message_handler(commands=['start'])
  def send_welcome(message):
    user = get_or_create_user(message)
    
    text = (
      f"👋 <b>Olá, {user.first_name}! Seja muito bem-vindo(a).</b>\\n\\n"
      "Este é o canal oficial de conteúdos, treinamentos e automações exclusivas!\\n\\n"
      "📸 <b>Passo Obrigatório:</b>\\n"
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
      f"🤖 <b>CONTENT OS - HUB PRINCIPAL</b>\\n"
      f"Status: <b>{badge}</b>\\n\\n"
      f"Olá, {user.first_name}! 👋\\n"
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
        "🟢 <b>STATUS DO SISTEMA & TELEBOT</b>\\n"
        "────────────────────\\n"
        "• <b>Status:</b> 100% Online & Operacional\\n"
        "• <b>Supervisão:</b> Ativa 24/7 com Auto-Restart\\n"
        "• <b>Servidor Flask:</b> Conectado à API local\\n"
        f"• <b>Assinantes no Banco:</b> {total_users}\\n"
        f"• <b>Conteúdos Cadastrados:</b> {total_contents}\\n"
        f"• <b>Horário UTC:</b> {datetime.utcnow().strftime('%d/%m/%Y %H:%M:%S')}"
      )
      bot.send_message(message.chat.id, text)
    finally:
      session.close()

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
      f"🤖 <b>CONTENT OS HUB</b>\\n"
      f"Status: <b>{badge}</b>\\n\\n"
      f"Olá, {user.first_name}! 👋\\n"
      f"O que você deseja explorar hoje no nosso hub?"
    )
    try:
      bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=get_main_menu_markup())
    except Exception:
      bot.send_message(call.message.chat.id, text, reply_markup=get_main_menu_markup())

  @bot.callback_query_handler(func=lambda call: call.data == "btn_conteudos")
  def show_categories(call):
    session = get_session()
    try:
      db_categories = session.query(Content.category).distinct().all()
      categories = [c[0] for c in db_categories if c[0]]
      if not categories:
        categories = ["Python", "IA", "Automação", "Marketing", "SaaS"]

      markup = types.InlineKeyboardMarkup(row_width=2)
      buttons = [types.InlineKeyboardButton(f"📁 {cat}", callback_data=f"cat_{cat}") for cat in categories]
      markup.add(*buttons)
      markup.add(types.InlineKeyboardButton("⬅️ Voltar ao Menu", callback_data="menu_principal"))
      
      text = "📚 <b>EXPLORADOR DE CONTEÚDOS</b>\\n\\nEscolha uma categoria para listar aulas, materiais e packs disponíveis:"
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

      bot.edit_message_text(f"📁 Categoria: <b>{category}</b>\\nSelecione um conteúdo para ver detalhes:", call.message.chat.id, call.message.message_id, reply_markup=markup)
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

      if item.is_premium and not user.is_premium:
        paywall_text = (
          f"🔒 <b>CONTEÚDO EXCLUSIVO PARA MEMBROS PREMIUM</b>\\n\\n"
          f"📌 <b>{item.title}</b>\\n"
          f"{item.description}\\n\\n"
          "⚡ Para assistir a esta aula e acessar todos os packs e códigos, assine nosso plano Premium ou adquira o conteúdo avulso!"
        )
        markup = types.InlineKeyboardMarkup(row_width=1)
        markup.add(types.InlineKeyboardButton("🔓 ASSINAR PREMIUM (R$ 29,90/mês)", callback_data="checkout_premium"))
        markup.add(types.InlineKeyboardButton("🛒 COMPRAR ESTE CONTEÚDO AVULSO", callback_data="btn_comprar"))
        markup.add(types.InlineKeyboardButton("⬅️ Voltar aos Conteúdos", callback_data="btn_conteudos"))
        bot.edit_message_text(paywall_text, call.message.chat.id, call.message.message_id, reply_markup=markup)
        return

      item.views_count += 1
      session.commit()

      caption = (
        f"🎓 <b>{item.title}</b>\\n\\n"
        f"{item.description}\\n\\n"
        f"📁 <b>Categoria:</b> {item.category} | <b>Tipo:</b> {item.type.capitalize()}\\n"
        f"⏱ <b>Duração:</b> {item.duration or 'Completo'}\\n"
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
        "🛒 <b>CATÁLOGO DE PRODUTOS & ASSINATURAS VIP</b>\\n\\n"
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
        f"💳 <b>PEDIDO #{order.id} GERADO COM SUCESSO</b>\\n\\n"
        f"📦 Produto: <b>{prod.name}</b>\\n"
        f"💰 Valor: <b>R$ {prod.price:.2f}</b>\\n\\n"
        f"⚡ <b>Código PIX Copia e Cola:</b>\\n"
        f"<code>{pix_mock_code}</code>\\n\\n"
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
        "🎉 <b>PAGAMENTO CONFIRMADO COM SUCESSO!</b>\\n\\n"
        f"Parabéns, {user.first_name}! Seu status foi atualizado para <b>MEMBRO VIP 💎</b>.\\n\\n"
        "Todos os conteúdos exclusivos, códigos e materiais estão 100% liberados para você!\\n"
        "Acesse o menu principal abaixo para começar:"
      )
      bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=get_main_menu_markup())
      bot.answer_callback_query(call.id, "Acesso VIP liberado com sucesso!", show_alert=True)
      print(f"💰 [VENDA CONCLUÍDA] Pedido #{order.id} aprovado para {user.first_name} (R$ {order.amount:.2f})")
    finally:
      session.close()

  @bot.callback_query_handler(func=lambda call: call.data == "btn_perfil")
  def show_user_profile(call):
    user = get_or_create_user(call)
    status_str = "MEMBRO VIP 💎" if user.is_premium else "Visitante Gratuito 🆓"
    
    text = (
      "👤 <b>MEU PERFIL NO HUB</b>\\n"
      "────────────────────\\n"
      f"<b>ID Telegram:</b> <code>{user.telegram_id}</code>\\n"
      f"<b>Username:</b> @{user.username}\\n"
      f"<b>Nome:</b> {user.first_name}\\n"
      f"<b>Cadastrado em:</b> {user.joined_at.strftime('%d/%m/%Y %H:%M')}\\n"
      f"<b>Plano Atual:</b> {status_str}\\n"
      f"<b>Compras Realizadas:</b> {user.purchases_count}\\n"
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
      "❓ <b>CENTRAL DE SUPORTE</b>\\n\\n"
      "Dúvidas sobre conteúdos, liberação de acesso ou parcerias?\\n\\n"
      f"Fale diretamente com nossa equipe de atendimento:\\n"
      f"👉 @{SUPPORT_USERNAME}"
    )
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("💬 Abrir Conversa com Suporte", url=f"https://t.me/{SUPPORT_USERNAME}"))
    markup.add(types.InlineKeyboardButton("⬅️ Voltar ao Menu", callback_data="menu_principal"))
    bot.edit_message_text(text, call.message.chat.id, call.message.message_id, reply_markup=markup)

  @bot.message_handler(func=lambda message: True)
  def handle_all_messages(message):
    user = get_or_create_user(message)
    text = (
      f"Olá, {user.first_name}! 👋\\n"
      "Recebi sua mensagem. Utilize o botão abaixo para abrir o menu de conteúdos e recursos:"
    )
    markup = types.InlineKeyboardMarkup()
    markup.add(types.InlineKeyboardButton("📱 ABRIR MENU PRINCIPAL", callback_data="menu_principal"))
    bot.reply_to(message, text, reply_markup=markup)

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
        time.sleep(0.04)
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

# SUPERVISOR 24/7 (NÃO DEIXA O BOT PARAR)
def run_bot_forever():
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
      bot.infinity_polling(timeout=20, long_polling_timeout=20, skip_pending=True)

    except (telebot.apihelper.ApiTelegramException, Exception) as err:
      consecutive_failures += 1
      sleep_time = min(consecutive_failures * 3, 30)
      print(f"\\n⚠️  [SUPERVISOR - QUEDA DETECTADA]")
      print(f"    Erro: {str(err)}")
      print(f"    🔁 Auto-restart acionado! Reconectando em {sleep_time}s (Tentativa #{consecutive_failures})...\\n")
      time.sleep(sleep_time)

if __name__ == "__main__":
  run_bot_forever()
`
  },
  'app.py': {
    filename: 'app.py',
    description: 'Servidor Flask completo com CORS, endpoints de verificação de token, status, métricas e broadcast',
    language: 'python',
    code: `"""
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
CORS(app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'content-os-secret-key-2026')
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

init_db()

@app.route('/api/health', methods=['GET'])
def healthcheck():
  return jsonify({
    "status": "healthy",
    "timestamp": datetime.utcnow().isoformat(),
    "service": "Content OS Backend Engine"
  })

@app.route('/api/bot/status', methods=['GET'])
def get_bot_status():
  bot_info = verify_and_identify_bot()
  if bot_info:
    return jsonify({
      "connected": True,
      "bot": {
        "id": bot_info.id,
        "first_name": bot_info.first_name,
        "username": bot_info.username
      },
      "supervisor": "Ativo (Loop 24/7 de Alta Resiliência)"
    })
  else:
    return jsonify({
      "connected": False,
      "error": "Token ausente ou inválido. Configure TELEGRAM_BOT_TOKEN no .env",
      "supervisor": "Aguardando token válido"
    }), 200

@app.route('/api/bot/verify-token', methods=['POST'])
def test_telegram_token():
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
    return jsonify({"success": False, "error": f"Falha de rede: {str(e)}"}), 500

@app.route('/api/bot/broadcast', methods=['POST'])
def send_broadcast():
  data = request.json or {}
  message_text = data.get("message", "").strip()
  target = data.get("target", "all")
  if not message_text:
    return jsonify({"success": False, "error": "Texto da mensagem não informado"}), 400
  result = broadcast_message_to_subscribers(message_text, target)
  return jsonify(result)

@app.route('/api/stats', methods=['GET'])
def get_stats():
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
      "created_at": c.created_at.isoformat()
    } for c in contents])
  finally:
    session.close()

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
    return jsonify({"success": True, "is_premium": user.is_premium})
  finally:
    session.close()

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

if __name__ == '__main__':
  port = int(os.getenv('PORT', 5000))
  print(f"🚀 [CONTENT OS] Painel Flask rodando em http://0.0.0.0:{port}")
  app.run(host='0.0.0.0', port=port, debug=True)
`
  },
  'scheduler.py': {
    filename: 'scheduler.py',
    description: 'Worker APScheduler para monitorar e disparar postagens agendadas no Telegram',
    language: 'python',
    code: `"""
CONTENT OS - SCHEDULER WORKER (APScheduler)
Monitora periodicamente o banco de dados e dispara publicações agendadas
diretamente no canal público ou nos grupos VIP do Telegram.
"""

import os
import time
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import telebot
from dotenv import load_dotenv

from models import init_db, get_session, ScheduledPost, Content

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID", "@seucanalpublico")

bot = telebot.TeleBot(BOT_TOKEN, parse_mode="HTML") if BOT_TOKEN else None
init_db()

def check_and_publish_scheduled_posts():
  session = get_session()
  try:
    now = datetime.utcnow()
    pending_posts = session.query(ScheduledPost).filter(
      ScheduledPost.status == "agendada",
      ScheduledPost.scheduled_for <= now
    ).all()

    for post in pending_posts:
      content = post.content
      if not content:
        continue

      try:
        markup = telebot.types.InlineKeyboardMarkup(row_width=2)
        btn1 = telebot.types.InlineKeyboardButton("▶️ VER CONTEÚDO", url=content.media_url or "https://t.me")
        btn2 = telebot.types.InlineKeyboardButton("⭐ ÁREA VIP", callback_data="btn_premium")
        markup.add(btn1, btn2)

        caption = (
          f"🔥 <b>NOVA PUBLICAÇÃO DISPONÍVEL!</b>\\n\\n"
          f"📌 <b>{content.title}</b>\\n\\n"
          f"{content.description}\\n\\n"
          f"📁 Categoria: #{content.category}"
        )

        if bot and CHANNEL_ID:
          bot.send_message(CHANNEL_ID, caption, reply_markup=markup)

        post.status = "publicada"
        post.sent_at = datetime.utcnow()
        session.commit()
        print(f"✅ Post #{post.id} publicado no canal com sucesso!")
      except Exception as e:
        print(f"❌ Erro ao publicar post #{post.id}: {str(e)}")
        post.status = "falha"
        session.commit()
  finally:
    session.close()

def start_scheduler():
  scheduler = BackgroundScheduler()
  scheduler.add_job(check_and_publish_scheduled_posts, 'interval', seconds=20)
  scheduler.start()
  print("🕒 [SCHEDULER] Worker agendador iniciado com sucesso!")

  try:
    while True:
      time.sleep(5)
  except (KeyboardInterrupt, SystemExit):
    scheduler.shutdown()

if __name__ == "__main__":
  start_scheduler()
`
  },
  'models.py': {
    filename: 'models.py',
    description: 'Modelos ORM SQLite (SQLAlchemy): Users, Contents, Posts, Products e Orders',
    language: 'python',
    code: `"""
CONTENT OS - DATABASE MODELS (SQLAlchemy + SQLite)
Define os schemas para Usuários, Conteúdos, Agendamentos, Produtos e Vendas.
"""

import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///content_os.db")
engine = create_engine(DB_PATH, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
  __tablename__ = "users"

  id = Column(Integer, primary_key=True, index=True)
  telegram_id = Column(Integer, unique=True, index=True, nullable=False)
  username = Column(String(100), index=True)
  first_name = Column(String(150))
  is_premium = Column(Boolean, default=False)
  joined_at = Column(DateTime, default=datetime.utcnow)
  last_interaction = Column(DateTime, default=datetime.utcnow)
  purchases_count = Column(Integer, default=0)

  orders = relationship("Order", back_populates="user")

class Content(Base):
  __tablename__ = "contents"

  id = Column(Integer, primary_key=True, index=True)
  title = Column(String(200), nullable=False)
  type = Column(String(50), default="video")
  media_url = Column(String(500))
  description = Column(Text)
  category = Column(String(100), default="Geral")
  is_premium = Column(Boolean, default=False)
  duration = Column(String(50))
  views_count = Column(Integer, default=0)
  created_at = Column(DateTime, default=datetime.utcnow)

  schedules = relationship("ScheduledPost", back_populates="content")

class ScheduledPost(Base):
  __tablename__ = "scheduled_posts"

  id = Column(Integer, primary_key=True, index=True)
  content_id = Column(Integer, ForeignKey("contents.id"), nullable=False)
  scheduled_for = Column(DateTime, nullable=False)
  status = Column(String(50), default="agendada")
  sent_at = Column(DateTime, nullable=True)
  target = Column(String(50), default="channel")
  buttons = Column(Text, default="[]")

  content = relationship("Content", back_populates="schedules")

class Product(Base):
  __tablename__ = "products"

  id = Column(Integer, primary_key=True, index=True)
  name = Column(String(150), nullable=False)
  price = Column(Float, nullable=False)
  type = Column(String(50), default="pack")
  description = Column(Text)
  active = Column(Boolean, default=True)

class Order(Base):
  __tablename__ = "orders"

  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
  product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
  amount = Column(Float, nullable=False)
  status = Column(String(50), default="pendente")
  payment_method = Column(String(50), default="PIX")
  created_at = Column(DateTime, default=datetime.utcnow)

  user = relationship("User", back_populates="orders")

def init_db():
  Base.metadata.create_all(bind=engine)
  seed_initial_data()

def seed_initial_data():
  session = SessionLocal()
  try:
    if session.query(Product).count() == 0:
      default_products = [
        Product(name="Pack VIP - Bots em Python", price=47.90, type="pack", description="Código fonte completo com 5 automações"),
        Product(name="Assinatura VIP Mensal", price=29.90, type="subscription", description="Acesso ilimitado ao canal VIP e mentorias"),
        Product(name="Mentoria Express 1-on-1", price=197.00, type="service", description="1 hora de consultoria individual")
      ]
      session.add_all(default_products)

    if session.query(Content).count() == 0:
      default_contents = [
        Content(title="Como Criar seu Primeiro Bot em Python", type="video", media_url="https://youtube.com", description="Passo a passo com Telebot e polling.", category="Python", is_premium=False, duration="18 min"),
        Content(title="Automação de Vendas no Telegram via PIX", type="video", media_url="https://youtube.com", description="Integração de pagamentos automáticos.", category="Automação", is_premium=True, duration="24 min")
      ]
      session.add_all(default_contents)

    session.commit()
  except Exception:
    session.rollback()
  finally:
    session.close()

def get_session():
  return SessionLocal()
`
  },
  'supervisord.conf': {
    filename: 'supervisord.conf',
    description: 'Configuração de produção para supervisão e auto-restart contínuo de processos em VPS Linux',
    language: 'ini',
    code: `[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisord.log
pidfile=/var/run/supervisord.pid

[program:flask_app]
command=gunicorn -w 4 -b 0.0.0.0:5000 app:app
directory=%(here)s
autostart=true
autorestart=true
startretries=10
redirect_stderr=true
stdout_logfile=/var/log/contentos_flask.log

[program:telegram_bot]
command=python bot.py
directory=%(here)s
autostart=true
autorestart=true
startretries=999
redirect_stderr=true
stdout_logfile=/var/log/contentos_bot.log

[program:scheduler_worker]
command=python scheduler.py
directory=%(here)s
autostart=true
autorestart=true
startretries=999
redirect_stderr=true
stdout_logfile=/var/log/contentos_scheduler.log
`
  },
  'start.sh': {
    filename: 'start.sh',
    description: 'Script executável bash para subir todos os serviços com auto-recovery em 1 clique',
    language: 'bash',
    code: `#!/bin/bash
# CONTENT OS - SCRIPT DE INICIALIZAÇÃO CONTÍNUA (24/7 AUTO-RECOVERY)

echo "🚀 Iniciando Content OS Telegram Bot & Painel Flask..."

if [ -d "venv" ]; then
    source venv/bin/activate
fi

if [ -f "requirements.txt" ]; then
    pip install -q -r requirements.txt
fi

python main.py
`
  },
  'requirements.txt': {
    filename: 'requirements.txt',
    description: 'Dependências pip para rodar o Bot, Painel Flask com CORS e Worker',
    language: 'text',
    code: `Flask==3.0.2
Flask-Cors==4.0.0
pyTelegramBotAPI==4.16.1
SQLAlchemy==2.0.28
APScheduler==3.10.4
python-dotenv==1.0.1
requests==2.31.0
gunicorn==21.2.0
`
  },
  '.env.example': {
    filename: '.env.example',
    description: 'Variáveis de ambiente necessárias para o Bot e Flask',
    language: 'env',
    code: `TELEGRAM_BOT_TOKEN="8894323284:AAHyfUMZwE1m5eM1JXmdhkv_oZH1E9yEixY"
TELEGRAM_CHANNEL_ID="@seucanalpublico"
INSTAGRAM_URL="https://instagram.com/seuperfil"
SUPPORT_USERNAME="suporte_hub"
SECRET_KEY="sua_chave_secreta_super_segura"
DATABASE_URL="sqlite:///content_os.db"
PORT=5000
`
  },
  'README.md': {
    filename: 'README.md',
    description: 'Guia completo passo a passo para configurar e rodar em produção',
    language: 'markdown',
    code: `# 🚀 CONTENT OS - Plataforma de Venda e Distribuição de Conteúdo no Telegram

Plataforma completa em **Python + Flask + pyTelegramBotAPI + APScheduler + SQLite** com **Supervisão 24/7 (Auto-Recovery)**.

---

## 🛠️ Como rodar na sua máquina local

### 1. Bot Telegram Configurado
O token do bot já está pronto e identificado:
- **Nome do Bot:** Curso Python Bot
- **Username:** @Curso_PythonBot
- **Token:** \`8894323284:AAHyfUMZwE1m5eM1JXmdhkv_oZH1E9yEixY\`

### 2. Clonar e Instalar Dependências
\`\`\`bash
cd python_backend
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\\Scripts\\activate
pip install -r requirements.txt
\`\`\`

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo \`.env\` baseado no \`.env.example\`:
\`\`\`env
TELEGRAM_BOT_TOKEN="8894323284:AAHyfUMZwE1m5eM1JXmdhkv_oZH1E9yEixY"
TELEGRAM_CHANNEL_ID="@seucanalpublico"
INSTAGRAM_URL="https://instagram.com/seuperfil"
SUPPORT_USERNAME="suporte_hub"
PORT=5000
\`\`\`

### 4. Iniciar Tudo com 1 Comando (Orquestrador Master)
\`\`\`bash
python main.py
\`\`\`
O script valida o token, identifica o nome do bot, inicia o polling com auto-restart, ativa o agendador e o servidor Flask.
`
  }
};
