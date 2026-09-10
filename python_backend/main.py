"""
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

def start_render_keep_alive():
  """
  Worker de Anti-Hibernação para o Render (Plano Free).
  Envia um ping HTTP a cada 10 minutos para a própria URL pública do Render,
  evitando que a instância entre em modo de suspensão por inatividade.
  """
  render_url = os.getenv('RENDER_EXTERNAL_URL') or os.getenv('KEEP_ALIVE_URL')
  if not render_url:
    # Se não houver URL pública configurada, não precisa pingar
    return

  print(f"🏓 [RENDER ANTI-SLEEP] Monitor ativo para URL: {render_url} (ping a cada 10 min)")
  # Aguarda 30 segundos para o Flask terminar de subir antes do primeiro ping
  time.sleep(30)
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
    
    # Aguarda 10 minutos (600 segundos) - Render suspende em 15 minutos
    time.sleep(600)

def run_flask_server():
  """Inicia o servidor Flask na porta especificada (Render usa PORT=10000 por padrão)."""
  port = int(os.getenv('PORT', 5000))
  print(f"🌐 [MAIN SUPERVISOR] Servidor Flask iniciando em http://0.0.0.0:{port}...")
  # Usamos debug=False para evitar duplo fork de subprocessos do Flask
  app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)

def main():
  print_banner()

  # 1. Inicializa o banco de dados e sementes iniciais
  print("📦 [ETAPA 1/3] Verificando banco de dados...")
  init_db()

  # 2. Conecta ao Telegram, valida token e identifica nome do bot
  print("\n📡 [ETAPA 2/3] Identificando e conectando Bot no Telegram...")
  bot_info = verify_and_identify_bot()
  if bot_info:
    print(f"✅ Bot verificado: {bot_info.first_name} (@{bot_info.username})")
  else:
    print("⚠️ Aviso: Bot não identificado no momento. O servidor iniciará e você poderá configurar o token depois.")

  # 3. Inicia o Worker do Bot em Thread com Supervisão
  print("\n🚀 [ETAPA 3/3] Iniciando serviços concorrentes com auto-recovery...")
  bot_thread = threading.Thread(target=run_bot_forever, daemon=True, name="TelegramBotThread")
  bot_thread.start()
  print("🤖 [SUPERVISOR] Thread do Bot Telegram ativa!")

  # 4. Inicia o Worker do Scheduler em Thread
  sched_thread = threading.Thread(target=start_scheduler_worker, daemon=True, name="SchedulerThread")
  sched_thread.start()
  print("⏰ [SUPERVISOR] Thread do Agendador ativa!")

  # 5. Inicia o Worker Anti-Sleep para o Render (caso RENDER_EXTERNAL_URL esteja presente)
  keep_alive_thread = threading.Thread(target=start_render_keep_alive, daemon=True, name="RenderKeepAliveThread")
  keep_alive_thread.start()

  # 6. Inicia o Watchdog Supervisor em Background
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

  # 7. Inicia o Flask na thread principal (mantém o processo vivo)
  run_flask_server()

if __name__ == "__main__":
  main()
