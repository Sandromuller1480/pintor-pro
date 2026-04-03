# SQL do Projeto

Este diretorio centraliza os scripts SQL aplicados manualmente no projeto.

## Ponto importante

Este repositorio nao versiona a criacao inicial da tabela `public.applications`.
Os scripts `add_*.sql`, `create_public_painter_directory.sql` e `supabase_schema.sql`
assumem que essa tabela ja existe no banco.

## Ordem recomendada para ambiente novo

### Schemas base

1. `clientes_schema.sql`
2. `portfolio_schema.sql`
3. `orcamentos_schema.sql`
4. `agendamentos_visitas_schema.sql`
5. `chat_interno_schema.sql`
6. `avaliacoes_schema.sql`

### Dados publicos, presenca e configuracoes

Escolha um caminho:

- `Consolidado`
  1. `supabase_schema.sql`

- `Modular`
  1. `painter_profile_views_schema.sql`
  2. `create_public_painter_directory.sql`
  3. `add_painter_presence_columns.sql`
  4. `add_painter_settings_columns.sql`

Nao aplique `supabase_schema.sql` e o bloco modular acima na mesma inicializacao sem necessidade, porque eles cobrem a mesma area funcional.

### Complementos necessarios na versao atual do produto

1. `add_application_form_columns.sql`
2. `add_profile_media_columns.sql`
3. `add_profile_cover_bucket.sql`
4. `add_portfolio_stage_media.sql`
5. `add_applications_rls_and_onboarding_storage.sql`
6. `admin_dashboard_schema.sql`
7. `add_portfolio_admin_moderation.sql`

## Scripts legados ou situacionais

- `add_video_column.sql`
  Ja foi absorvido por `add_portfolio_stage_media.sql`.

- `add_orcamentos_media_bucket.sql`
  Ja esta embutido em `orcamentos_schema.sql`. So use se o bucket ainda nao existir em uma base antiga.

## Observacao

Sempre revise o diff antes de aplicar em producao. Para a reta final da plataforma, use tambem o checklist em `docs/plataforma-go-live-checklist.md`.

## Nota sobre RLS no credenciamento do pintor

O fluxo atual de credenciamento agora prefere operar com sessao autenticada quando o `signUp`
do Supabase ja retorna `session`, reduzindo a dependencia da policy anonima de `UPDATE`
em `public.applications`.

Ainda assim, mantenha `add_applications_rls_and_onboarding_storage.sql` aplicado, porque ele
continua sendo necessario para cenarios em que o `signUp` nao devolve sessao imediatamente
(por exemplo, confirmacao de e-mail habilitada). O desenho ideal de longo prazo continua sendo
migrar esse onboarding para uma Edge Function.
