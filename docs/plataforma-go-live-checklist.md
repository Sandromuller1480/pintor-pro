# Checklist Final da Plataforma

Checklist pragmatico para fechar a subida da PINTOR PRO com menos risco operacional.

## 1. Banco e SQL

- Confirmar que a tabela `public.applications` ja existe na base.
- Aplicar os schemas base:
  - `supabase/sql/clientes_schema.sql`
  - `supabase/sql/portfolio_schema.sql`
  - `supabase/sql/orcamentos_schema.sql`
  - `supabase/sql/agendamentos_visitas_schema.sql`
  - `supabase/sql/chat_interno_schema.sql`
  - `supabase/sql/avaliacoes_schema.sql`
- Aplicar a parte publica e operacional por um dos caminhos:
  - `supabase/sql/supabase_schema.sql`
  - ou o conjunto modular descrito em `supabase/sql/README.md`
- Aplicar os complementos atuais:
  - `supabase/sql/add_application_form_columns.sql`
  - `supabase/sql/add_profile_media_columns.sql`
  - `supabase/sql/add_profile_cover_bucket.sql`
  - `supabase/sql/add_portfolio_stage_media.sql`
  - `supabase/sql/add_applications_rls_and_onboarding_storage.sql`
  - `supabase/sql/admin_dashboard_schema.sql`
  - `supabase/sql/add_portfolio_admin_moderation.sql`
  - `supabase/sql/add_admin_audit_logs.sql`
- Validar se os buckets existem:
  - `portfolio-obras`
  - `orcamentos-media`
  - `painters-media`
  - `application-work-photos`

## 2. Variaveis de ambiente

- Frontend:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Edge Functions:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_SILVER_MONTHLY`
  - `STRIPE_PRICE_PRO_MONTHLY`
  - `APP_BASE_URL`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`

## 3. Fluxos manuais obrigatorios

- Cadastro e login de pintor.
- Cadastro de pintor com `confirmacao de e-mail desabilitada` no Supabase.
- Cadastro de pintor com `confirmacao de e-mail habilitada` no Supabase.
- Cadastro e login de cliente.
- Busca publica com filtros por cidade, especialidade e online.
- Perfil publico com:
  - selo online e offline em tempo real
  - botoes de chat e agendamento respeitando disponibilidade
  - portfolio publico com visualizacao por etapas
- Dashboard do pintor:
  - portfolio com ver e editar obra
  - agenda com mudanca de status
  - configuracoes com disponibilidade, horario e notificacoes
  - visao geral com funil, periodo e origem dos contatos
- Dashboard admin:
  - login do admin
  - leitura de aplicacoes, operacao e assinaturas
  - moderacao de portfolio
  - trilha de auditoria apos aprovar, reprovar, bloquear ou alterar plano
- Chat interno entre cliente e pintor.
- Agendamento de visita ate aparecer no painel do pintor.
- Checkout de plano e webhook do Stripe.

## 4. Verificacoes de producao

- Rodar `npm run typecheck`.
- Rodar `npm run build`.
- Validar responsividade minima em desktop e mobile.
- Conferir politicas RLS das tabelas e do storage.
- Conferir se a view `public.painter_directory_public` retorna:
  - status online
  - `last_seen_at`
  - preferencias de chat e visita
  - horario de atendimento

## 5. Riscos ainda conhecidos

- O projeto ainda usa Tailwind via CDN no `index.html`.
- Ainda nao existe suite de testes automatizados.
- O build ainda gera aviso de chunk grande, mas sem falha funcional.
- O credenciamento do pintor ainda depende de suporte publico controlado na tabela `applications`
  e nos buckets de onboarding enquanto esse fluxo nao for migrado para Edge Function.
