"""
CONTENT OS - SCHEDULER WORKER (APScheduler)
Monitora periodicamente o banco de dados e dispara publicações agendadas
diretamente no canal público ou nos grupos VIP do Telegram.
Inclui loop de tolerância a falhas para operação ininterrupta 24/7.
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

# Garante que as tabelas existam
init_db()

def check_and_publish_scheduled_posts():
  """Verifica publicações agendadas que atingiram o horário de envio."""
  session = get_session()
  try:
    now = datetime.utcnow()
    pending_posts = session.query(ScheduledPost).filter(
      ScheduledPost.status == "agendada",
      ScheduledPost.scheduled_for <= now
    ).all()

    if pending_posts:
      print(f"⏰ [SCHEDULER] Encontrados {len(pending_posts)} post(s) para disparo em {now.strftime('%H:%M:%S')}...")

    for post in pending_posts:
      content = post.content
      if not content:
        continue

      print(f"🚀 [DISPARO AUTOMÁTICO] Publicando post #{post.id}: '{content.title}'")

      try:
        markup = telebot.types.InlineKeyboardMarkup(row_width=2)
        btn1 = telebot.types.InlineKeyboardButton("▶️ VER CONTEÚDO", url=content.media_url or "https://t.me")
        btn2 = telebot.types.InlineKeyboardButton("⭐ ÁREA VIP", callback_data="btn_premium")
        markup.add(btn1, btn2)

        caption = (
          f"🔥 <b>NOVA PUBLICAÇÃO DISPONÍVEL!</b>\n\n"
          f"📌 <b>{content.title}</b>\n\n"
          f"{content.description}\n\n"
          f"📁 Categoria: #{content.category}"
        )

        if bot and CHANNEL_ID:
          bot.send_message(CHANNEL_ID, caption, reply_markup=markup)

        post.status = "publicada"
        post.sent_at = datetime.utcnow()
        session.commit()
        print(f"✅ [POST PUBLICADO] Post #{post.id} enviado com sucesso ao canal {CHANNEL_ID}!")
      except Exception as e:
        print(f"❌ [ERRO DE DISPARO] Erro ao publicar post #{post.id}: {str(e)}")
        post.status = "falha"
        session.commit()
  except Exception as db_err:
    print(f"⚠️ [SCHEDULER DB] Erro ao consultar banco: {str(db_err)}")
  finally:
    session.close()

def start_scheduler():
  """Inicia o agendador em background com supervisão contínua."""
  scheduler = BackgroundScheduler()
  # Executa a cada 20 segundos
  scheduler.add_job(check_and_publish_scheduled_posts, 'interval', seconds=20)
  scheduler.start()
  print("🕒 [SCHEDULER] Worker agendador iniciado com sucesso (intervalo: 20s)!")

  try:
    while True:
      time.sleep(5)
  except (KeyboardInterrupt, SystemExit):
    print("🛑 [SCHEDULER] Finalizando worker...")
    scheduler.shutdown()

if __name__ == "__main__":
  start_scheduler()
