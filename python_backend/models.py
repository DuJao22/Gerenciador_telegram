"""
CONTENT OS - DATABASE MODELS (SQLAlchemy + SQLite)
Define os schemas para Usuários, Conteúdos, Agendamentos, Produtos e Vendas.
"""

import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# Configuração da URL do banco de dados (Otimizado para Render e SQLite/PostgreSQL)
db_path = os.getenv("DATABASE_URL", "sqlite:///content_os.db")

# No Render, conexões PostgreSQL antigas usam postgres://, mas SQLAlchemy 2.0 requer postgresql://
if db_path.startswith("postgres://"):
  db_path = db_path.replace("postgres://", "postgresql://", 1)

# Se um Persistent Disk estiver montado no Render em /data, usa-o automaticamente para persistência
if db_path == "sqlite:///content_os.db" and os.path.exists("/data") and os.path.isdir("/data"):
  db_path = "sqlite:////data/content_os.db"

# connect_args={"check_same_thread": False} só pode ser passado para SQLite
connect_args = {"check_same_thread": False} if db_path.startswith("sqlite") else {}

engine = create_engine(db_path, connect_args=connect_args)
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
  print("📦 [DATABASE] Banco de dados SQLite inicializado com sucesso!")
  seed_initial_data()

def seed_initial_data():
  session = SessionLocal()
  try:
    if session.query(Product).count() == 0:
      default_products = [
        Product(name="Pack VIP - Bots em Python", price=47.90, type="pack", description="Código fonte completo com 5 automações e bots prontos"),
        Product(name="Assinatura VIP Mensal", price=29.90, type="subscription", description="Acesso ilimitado a todas as aulas, códigos e suporte no canal VIP"),
        Product(name="Mentoria Express 1-on-1", price=197.00, type="service", description="1 hora de consultoria individual sobre automação e escala no Telegram")
      ]
      session.add_all(default_products)
      print("🌱 [DATABASE] Produtos padrão semeados com sucesso!")

    if session.query(Content).count() == 0:
      default_contents = [
        Content(title="Como Criar seu Primeiro Bot em Python", type="video", media_url="https://youtube.com", description="Passo a passo completo com Telebot e polling.", category="Python", is_premium=False, duration="18 min"),
        Content(title="Automação de Vendas no Telegram via PIX", type="video", media_url="https://youtube.com", description="Integração de pagamentos automáticos e liberação imediata.", category="Automação", is_premium=True, duration="24 min"),
        Content(title="Agendamento Inteligente com APScheduler", type="code", media_url="https://github.com", description="Script worker para publicações programadas 24/7.", category="Python", is_premium=False, duration="12 min"),
        Content(title="Prompt Engineering com Gemini & Claude", type="pdf", media_url="https://t.me", description="Guia prático para criar agentes inteligentes.", category="IA", is_premium=True, duration="45 págs"),
        Content(title="Funil de Vendas de Alta Conversão no Telegram", type="video", media_url="https://youtube.com", description="Estratégia comprovada para monetizar audiências.", category="Marketing", is_premium=False, duration="31 min")
      ]
      session.add_all(default_contents)
      print("🌱 [DATABASE] Conteúdos padrão semeados com sucesso!")

    session.commit()
  except Exception as e:
    session.rollback()
    print(f"⚠️ [DATABASE SEED] Aviso: {str(e)}")
  finally:
    session.close()

def get_session():
  return SessionLocal()
