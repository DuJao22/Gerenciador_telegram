"""
CONTENT OS - WSGI ENTRYPOINT COM GUNICORN (wsgi.py)
Servidor de produção otimizado para Render, Railway e VPS Linux.

Inicializa de forma concorrente e supervisionada:
1. 🌐 Servidor WSGI Flask via Gunicorn
2. 🤖 Thread do Telegram Bot com Infinity Polling e Auto-Recovery
3. ⏰ Thread do Agendador de Postagens Automáticas (APScheduler)
4. 🏓 Monitor Anti-Sleep (Keep-Alive para plano gratuito do Render)
5. 🛡️ Watchdog 24/7 de reinício automático
"""

import os
import sys
import time
import threading
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from app import app
from models import init_db
from bot import verify_and_identify_bot, run_bot_forever
from scheduler import check_and_publish_scheduled_posts
from apscheduler.schedulers.background import BackgroundScheduler
import requests

_services_initialized = False
_init_lock = threading.Lock()

def start_scheduler_worker():
  """Worker de agendamento em thread de background."""
  try:
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_and_publish_scheduled_posts, 'interval', seconds=20)
    scheduler.start()
    print("⏰ [GUNICORN WSGI] Worker de agendamento APScheduler iniciado (20s)!")
    while True:
      time.sleep(10)
  except Exception as e:
    print(f"❌ [GUNICORN WSGI - SCHEDULER ERRO]: {e}")

def start_render_keep_alive():
  """
  Worker de Anti-Hibernação para o Render (Plano Free).
  Envia um ping HTTP a cada 10 minutos para a própria URL pública do Render,
  evitando que a instância entre em modo de suspensão por inatividade.
  """
  render_url = os.getenv('RENDER_EXTERNAL_URL') or os.getenv('KEEP_ALIVE_URL')
  if not render_url:
    return

  print(f"🏓 [RENDER ANTI-SLEEP] Monitor ativo para URL: {render_url} (ping a cada 10 min)")
  time.sleep(25)
  while True:
    try:
      ping_target = f"{render_url.rstrip('/')}/ping"
      resp = requests.get(ping_target, timeout=10)
      if resp.status_code == 200:
        print(f"🏓 [RENDER ANTI-SLEEP] Ping enviado com sucesso ({datetime.utcnow().strftime('%H:%M:%S')}) - Instância Ativa!")
      else:
        print(f"⚠️ [RENDER ANTI-SLEEP] Resposta do ping: {resp.status_code}")
    except Exception as err:
      print(f"⚠️ [RENDER ANTI-SLEEP] Falha ao enviar ping: {err}")
    time.sleep(600)

def init_production_services():
  """Inicializa o banco de dados e as threads do bot e agendador em background."""
  global _services_initialized
  with _init_lock:
    if _services_initialized:
      return
    _services_initialized = True

    print("=" * 72)
    print("  🚀 [GUNICORN WSGI] INICIALIZANDO CONTENT OS & TELEGRAM BOT NO RENDER")
    print("=" * 72)

    # 1. Banco de dados
    print("📦 [GUNICORN WSGI] 1/3 Verificando banco de dados...")
    init_db()

    # 2. Conecta e identifica bot
    print("📡 [GUNICORN WSGI] 2/3 Validando token do Telegram Bot...")
    bot_info = verify_and_identify_bot()
    if bot_info:
      print(f"✅ Bot verificado: {bot_info.first_name} (@{bot_info.username})")
    else:
      print("⚠️ Token ainda não configurado ou aguardando inserção pela engrenagem do sistema.")

    # 3. Threads de execução contínua 24/7
    print("🤖 [GUNICORN WSGI] 3/3 Disparando threads de background do Bot e Scheduler...")
    bot_thread = threading.Thread(target=run_bot_forever, daemon=True, name="GunicornTelegramBotThread")
    bot_thread.start()

    sched_thread = threading.Thread(target=start_scheduler_worker, daemon=True, name="GunicornSchedulerThread")
    sched_thread.start()

    keep_alive_thread = threading.Thread(target=start_render_keep_alive, daemon=True, name="GunicornKeepAliveThread")
    keep_alive_thread.start()

    # Watchdog 24/7 para manter threads vivas
    def watchdog():
      nonlocal bot_thread, sched_thread
      while True:
        time.sleep(15)
        if not bot_thread.is_alive():
          print("⚠️ [WATCHDOG] Thread do bot parou! Reiniciando no Gunicorn...")
          bot_thread = threading.Thread(target=run_bot_forever, daemon=True, name="GunicornTelegramBotThread")
          bot_thread.start()
        if not sched_thread.is_alive():
          print("⚠️ [WATCHDOG] Thread do agendador parou! Reiniciando no Gunicorn...")
          sched_thread = threading.Thread(target=start_scheduler_worker, daemon=True, name="GunicornSchedulerThread")
          sched_thread.start()

    watchdog_thread = threading.Thread(target=watchdog, daemon=True, name="GunicornWatchdogThread")
    watchdog_thread.start()
    print("🛡️ [GUNICORN WSGI] Supervisor Watchdog 24/7 ativo!")

# Dispara a inicialização assim que o Gunicorn importar o módulo
init_production_services()

if __name__ == "__main__":
  port = int(os.getenv("PORT", 5000))
  app.run(host="0.0.0.0", port=port)
