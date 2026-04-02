# PINTOR PRO

Marketplace vertical para captacao e gestao de pintores profissionais, com vitrine publica, area logada, cadastros de clientes, chat interno, agenda de visitas e assinaturas via Stripe.

## Stack

- React 19 + TypeScript + Vite
- Supabase Auth, Database, Storage e Realtime
- Supabase Edge Functions para checkout, webhook e analise automatica
- Tailwind via CDN no shell HTML atual

## Estrutura

```text
components/                  componentes compartilhados e modais legados
features/
  client-auth/               modais de login/cadastro de cliente
  dashboard/                 tabs, utilitarios e acesso a dados do painel
  painter-profile/           secoes e utilitarios do perfil publico
lib/
  services/                  servicos de negocio integrados ao Supabase
pages/                       paginas principais da SPA
supabase/
  functions/                 edge functions
  sql/                       scripts SQL organizados por recurso
docs/                        guias operacionais e checklist
```

## Setup Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variaveis do frontend

Copie `.env.example` para `.env.local` e preencha:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 3. Aplicar SQL no Supabase

Os scripts estao em `supabase/sql/`.

Leia primeiro:

- `supabase/sql/README.md`
- `docs/plataforma-go-live-checklist.md`

Resumo da ordem atual:

1. Schemas base: `clientes_schema.sql`, `portfolio_schema.sql`, `orcamentos_schema.sql`, `agendamentos_visitas_schema.sql`, `chat_interno_schema.sql`, `avaliacoes_schema.sql`
2. Publico, presenca e configuracoes: use `supabase_schema.sql` ou o conjunto modular equivalente descrito em `supabase/sql/README.md`
3. Complementos atuais: `add_application_form_columns.sql`, `add_profile_media_columns.sql`, `add_profile_cover_bucket.sql`, `add_portfolio_stage_media.sql`, `add_applications_rls_and_onboarding_storage.sql`

Importante:

- Este repositorio nao inclui a criacao inicial da tabela `public.applications`
- Os scripts incrementais assumem que `public.applications` ja existe

### 4. Rodar o projeto

```bash
npm run dev
```

### 5. Validar build

```bash
npm run build
npm run typecheck
```

## Variaveis das Edge Functions

Veja `supabase/functions/.env.example`.

Principais secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SILVER_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `APP_BASE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## Fluxos Principais

- Cadastro de pintor com upload de anexos e analise automatica
- Busca publica de pintores
- Perfil publico com portfolio, reviews, chat e agendamento
- Cadastro/login de clientes
- Painel do pintor com portfolio, orcamentos, agenda e chat
- Assinaturas recorrentes com Stripe e webhook de sincronizacao

## Arquivos Relevantes

- `App.tsx`
- `pages/Register.tsx`
- `pages/Dashboard.tsx`
- `pages/PainterProfile.tsx`
- `lib/services/paintersService.ts`
- `lib/services/clientSignupService.ts`
- `lib/services/subscriptionService.ts`
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/process-application/index.ts`

## Observacoes

- O projeto ainda usa Tailwind via CDN em `index.html`. A base foi limpa, mas ainda nao foi migrada para uma pipeline local de Tailwind.
- Nao existe suite de testes automatizados no repositorio neste momento.
- O checklist final de subida da plataforma esta em `docs/plataforma-go-live-checklist.md`.
