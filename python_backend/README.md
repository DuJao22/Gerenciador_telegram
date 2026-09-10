# 🤖 Content OS - Telegram Bot & Servidor Flask (24/7 Auto-Recovery)

Plataforma completa em Python para monetização, publicação de conteúdos e automação no Telegram, controlada por um Painel Web e API em Flask.

---

## ⚡ Destaques de Robustez & Arquitetura

1. **Recepção e Identificação Automática do Token**:
   - Ao iniciar, o bot conecta à API do Telegram (`bot.get_me()`) e valida o token.
   - Identifica e exibe no console e na API o **Nome do Bot**, **@Username**, **Bot ID** e permissões.
   - Endpoint de teste instantâneo: `POST /api/bot/verify-token` e `GET /api/bot/status`.

2. **Operação Contínua 24/7 ("Não Deixa Parar")**:
   - **Supervisor com Auto-Recovery**: Envolve o `bot.infinity_polling()` em um loop de captura de exceções (`requests.exceptions`, `ApiTelegramException`, quedas de DNS e internet).
   - Em caso de desconexão, aplica backoff inteligente e reconecta automaticamente sem derrubar o processo.
   - **Watchdog de Threads**: O arquivo `main.py` monitora o worker do bot e do scheduler; se qualquer um morrer, ele o ressuscita imediatamente.
   - Arquivo `supervisord.conf` e scripts de systemd para ambientes de produção.

3. **Servidor Flask de Suporte Integral**:
   - API REST com suporte a CORS para o Painel Web.
   - Endpoints para estatísticas (`/api/stats`), conteúdos (`/api/contents`), CRM de usuários (`/api/users`), liberação de VIP (`/api/users/<id>/toggle-premium`), catálogo de produtos (`/api/products`), pedidos e PIX (`/api/orders`), e transmissões em massa (`/api/bot/broadcast`).

4. **Automação Completa do Bot (`bot.py`)**:
   - Fluxo de entrada `/start` com verificação de Instagram.
   - Teclados interativos Inline (Menus, Categorias, Aulas, Packs).
   - Paywall e verificação de assinante VIP.
   - Gerador de cobrança PIX copia-e-cola com simulação ou confirmação instantânea.
   - Disparo automático de postagens agendadas via APScheduler.

---

## 🚀 Como Iniciar

### 1. Configuração do Ambiente

```bash
# Clone e entre na pasta
cd python_backend

# Crie e ative um ambiente virtual
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instale as dependências
pip install -r requirements.txt
```

### 2. Configure as Variáveis no `.env`

Copie o `.env.example`:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
TELEGRAM_BOT_TOKEN="SEU_TOKEN_DO_BOTFATHER_AQUI"
TELEGRAM_CHANNEL_ID="@seucanalpublico"
INSTAGRAM_URL="https://instagram.com/seuperfil"
SUPPORT_USERNAME="seusuporte"
PORT=5000
```

### 3. Inicie com o Orquestrador Master (Tudo em 1 Comando)

```bash
python main.py
```

O `main.py` irá:
- Validar o token e imprimir o banner com o nome do bot.
- Iniciar o Bot Telegram em thread protegida.
- Iniciar o Agendador (Scheduler) em thread protegida.
- Iniciar o Watchdog de supervisão 24/7.
- Iniciar o servidor Flask na porta 5000.

*(Caso queira rodar os serviços em terminais separados, você também pode executar `python app.py`, `python bot.py` e `python scheduler.py` individualmente).*

---

## 🌐 Como Hospedar no Render (Passo a Passo Otimizado)

O sistema já está 100% otimizado para o **Render** com:
- Detecção automática de porta (`PORT`)
- Endpoint de Health Check (`/api/health` e `/ping`)
- **Sistema Anti-Sleep / Keep-Alive**: Envia pings automáticos para si mesmo a cada 10 minutos para impedir que o plano Free do Render hiberne após 15 minutos de inatividade!
- Blueprint `render.yaml` para configuração com 1 clique.

### Opção A: Deploy Automático via Blueprint (Recomendado)
1. Crie uma conta gratuita em [render.com](https://render.com).
2. Conecte sua conta do GitHub ou GitLab.
3. No painel do Render, clique no botão azul **"New +"** no topo e selecione **"Blueprint"**.
4. Selecione o repositório deste projeto.
5. O Render lerá o arquivo `render.yaml` e pré-configurará tudo:
   - **Runtime**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Health Check**: `/api/health`
6. Confirme e clique em **"Apply"**. Pronto! Seu bot estará online 24/7!

### Opção B: Deploy Manual como Web Service
1. No Render, clique em **"New +"** -> **"Web Service"**.
2. Conecte o repositório.
3. Preencha os campos:
   - **Name**: `curso-python-bot` (ou o nome que desejar)
   - **Root Directory**: `python_backend` (se estiver numa subpasta)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Plan**: `Free`
4. Na aba **Environment Variables**, adicione:
   - `TELEGRAM_BOT_TOKEN`: `8894323284:AAHyfUMZwE1m5eM1JXmdhkv_oZH1E9yEixY`
   - `TELEGRAM_CHANNEL_ID`: `@seucanalpublico`
   - `INSTAGRAM_URL`: `https://instagram.com/seuperfil`
   - `SUPPORT_USERNAME`: `suporte_hub`
   - `PYTHON_VERSION`: `3.11.8`
5. Clique em **"Create Web Service"**.
6. O Render fornecerá uma URL pública (ex: `https://curso-python-bot.onrender.com`). O bot identificará essa URL e manterá a instância sempre acordada!

---

## 🛡️ Produção em VPS (Supervisord / Systemd)

Para servidores Linux (Ubuntu/Debian), utilize o arquivo `supervisord.conf`:

```bash
supervisord -c supervisord.conf
supervisorctl status
```
