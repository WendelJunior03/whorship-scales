# Deploy em produção — Worship Stage

Stack de produção escolhida:

| Camada    | Serviço  | Por quê |
|-----------|----------|---------|
| Frontend  | **Vercel** | Expo web export → estático/PWA. Vercel é feito pra isso. |
| Backend   | **Render** | Express monolito long-running + pool `pg` + webhook Stripe (raw body). Container, não serverless. |
| Banco     | **Neon**   | Postgres serverless; role custom + GUC + RLS (`SET LOCAL`) funcionam sem atrito. Já era o alvo do `.env.example`. |

> Ordem importa: **Neon → Render → Vercel**. O front precisa da URL do Render, que
> precisa das URLs do Neon.

---

## 1. Banco — Neon

1. Crie um projeto no [Neon](https://neon.tech). Anote a **connection string** (com `?sslmode=require`).
2. Essa string inicial é do role **admin** → é o `DATABASE_URL` (migrations/seed).
3. Rode as migrations e o seed a partir da sua máquina (ou de um job), apontando `DATABASE_URL` pro Neon:
   ```bash
   cd backend
   DATABASE_URL="postgres://...neon.../db?sslmode=require" npm run migrate:up
   # (opcional) DATABASE_URL="..." npm run seed
   ```
   A migration de RLS cria o role **`deepscales_app`** (não-superusuário).
4. Defina uma **senha forte** pro role `deepscales_app` no Neon (SQL Editor):
   ```sql
   ALTER ROLE deepscales_app WITH PASSWORD 'uma_senha_bem_grande';
   ```
5. Monte a `APP_DATABASE_URL` apontando pra esse role:
   `postgres://deepscales_app:uma_senha_bem_grande@...neon.../db?sslmode=require`

> **Pooler:** use o endpoint **pooled** do Neon (`-pooler`) na `APP_DATABASE_URL`. O RLS
> usa `SET LOCAL` por transação (ver `backend/src/config/database.ts`), compatível com
> transaction mode. Para migrations use o endpoint **direto** (sem `-pooler`).

## 2. Backend — Render

Já existe `render.yaml` na raiz (Blueprint).

1. No Render: **New → Blueprint** → aponte pro repo. Ele lê o `render.yaml`.
2. Preencha as env vars marcadas como secretas no painel:
   - `DATABASE_URL` → endpoint **direto** do Neon (admin).
   - `APP_DATABASE_URL` → endpoint **pooled** do Neon (role `deepscales_app`).
   - `JWT_SECRET`, `APP_ENC_KEY` → o Blueprint já gera (`generateValue`).
   - `FRONTEND_URL` → a URL da Vercel (preencha depois do passo 3, ou já com o domínio final).
   - `CORS_ORIGINS` → só se tiver domínio próprio além da Vercel.
   - Integrações: `RESEND_API_KEY`, `GOOGLE_CLIENT_ID/SECRET`.
   - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_*`, `BILLING_*_URL`.
3. Deploy. Anote a URL pública (ex.: `https://worship-stage-api.onrender.com`).

> **Free tier do Render dorme** após inatividade (cold start ~30s). Pra um app real,
> suba pro plano pago quando for pra valer.

## 3. Frontend — Vercel

Já existe `frontend/vercel.json`.

1. No Vercel: **New Project** → repo. **Root Directory = `frontend`**.
   (Build/output já vêm do `vercel.json`: `npm run build:web` → `dist`.)
2. Env vars (Production):
   - `EXPO_PUBLIC_API_URL` → a URL do Render (ex.: `https://worship-stage-api.onrender.com`).
   - `EXPO_PUBLIC_GOOGLE_CLIENT_ID` → Client ID Web do Google.
3. Deploy. Anote a URL (ex.: `https://worship-stage.vercel.app`).
4. Volte no Render e ajuste `FRONTEND_URL` pra essa URL (libera CORS + e-mails).

## 4. Ajustes finais (integrações)

- **Google OAuth** (Cloud Console → Credentials → OAuth Client Web):
  - *Authorized JavaScript origins*: a URL da Vercel.
  - *Authorized redirect URIs*: os callbacks usados pelo login/agenda.
- **Stripe** (Dashboard):
  - Novo endpoint de **webhook** apontando pra `https://<api-render>/billing/webhook`.
    Copie o *signing secret* pro `STRIPE_WEBHOOK_SECRET` no Render.
  - `BILLING_SUCCESS_URL` / `BILLING_CANCEL_URL` → páginas na URL da Vercel.
  - Comece com chaves de **teste**; só troque pro live no go-live, com o dono.

---

## Checklist de env vars

**Render (API):**
`DATABASE_URL`, `APP_DATABASE_URL`, `JWT_SECRET`, `APP_ENC_KEY`, `FRONTEND_URL`,
`CORS_ORIGINS?`, `RESEND_API_KEY?`, `GOOGLE_CLIENT_ID?`, `GOOGLE_CLIENT_SECRET?`,
`STRIPE_SECRET_KEY?`, `STRIPE_WEBHOOK_SECRET?`, `STRIPE_PRICE_PRO_MENSAL?`,
`STRIPE_PRICE_PRO_ANUAL?`, `BILLING_SUCCESS_URL?`, `BILLING_CANCEL_URL?`, `GETSONGBPM_API_KEY?`

**Vercel (web):**
`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID?`

(`?` = opcional; sem ela o recurso correspondente fica desligado, o app sobe normal.)
