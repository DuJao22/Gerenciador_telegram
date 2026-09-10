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

## 🛡️ Produção em VPS (Supervisord / Systemd)

Para servidores Linux (Ubuntu/Debian), utilize o arquivo `supervisord.conf`:

```bash
supervisord -c supervisord.conf
supervisorctl status
```
