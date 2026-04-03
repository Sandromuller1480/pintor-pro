# Matriz Final de Validacao com RLS Ativa

Esta matriz resume a revisao tecnica dos fluxos mais importantes da plataforma com RLS ativa.
Ela nao substitui o teste manual em ambiente real, mas mostra o que ja esta coerente no codigo
e quais riscos ainda existem no desenho atual.

## Status geral

- `Coberto`: o fluxo esta coerente com as policies e grants atuais.
- `Parcial`: o fluxo principal funciona, mas ainda existe exposicao residual ou dependencia de desenho legado.
- `Pendente de teste real`: o fluxo depende de validacao ponta a ponta com Supabase e servicos externos ativos.

## Matriz

| Fluxo | Tabelas / Buckets | Status | Observacao |
| --- | --- | --- | --- |
| Credenciamento do pintor | `applications`, `application-work-photos`, `application-certifications` | `Coberto` | O onboarding agora usa `onboarding_token` e a RPC `finalize_painter_application_assets`, reduzindo a necessidade de `UPDATE` publico amplo. |
| Login e perfil de cliente | `clientes` | `Coberto` | O cadastro do cliente funciona com e sem sessao imediata no `signUp`, porque a tabela aceita `INSERT` publico controlado e leitura/edicao do proprio perfil autenticado. |
| Vitrine publica do pintor | `painter_directory_public`, `painter_reviews`, `painter_profile_views` | `Coberto` | A leitura publica da view, reviews e contagem de views esta coerente com o desenho atual. |
| Chat cliente x pintor | `painter_chat_threads`, `painter_chat_messages` | `Coberto` | Cliente autenticado ou anonimo autenticado consegue abrir e continuar conversa; pintor le e responde apenas nas threads proprias. |
| Agenda de visitas | `painter_visit_requests` | `Coberto` | Criacao publica controlada e leitura/edicao exclusiva do pintor dono da aplicacao. |
| Orcamentos do pintor | `orcamentos`, `orcamentos-media` | `Coberto` | O fluxo do painel do pintor esta alinhado com as policies de `INSERT`, `SELECT`, `UPDATE` e bucket privado por `auth.uid()`. |
| Dashboard do pintor | `applications`, `obras`, `orcamentos`, `painter_visit_requests`, `painter_chat_threads`, `painter_chat_messages`, `painter_profile_views`, `painters-media` | `Coberto` | As queries do painel estao compatíveis com leitura/escrita do proprio pintor. |
| Dashboard admin | `admin_users`, `admin_action_logs`, `applications`, `clientes`, `obras`, `orcamentos`, `painter_chat_threads`, `painter_visit_requests`, `painter_profile_views` | `Coberto` | O acesso administrativo atual esta coerente com `is_admin()` e as policies auxiliares. |
| Moderacao publica do portfolio | `obras`, `portfolio-obras` | `Coberto` | A tabela `obras` ja respeita `is_publicly_visible` e `admin_review_status`, e o bucket pode ser fechado com `add_portfolio_private_media.sql` para servir a vitrine por signed URL. |
| Assinaturas e cobranca | Edge Functions + tabelas de billing | `Pendente de teste real` | O fluxo depende de Stripe, webhooks e segredos do projeto. Precisa de validacao ponta a ponta com ambiente configurado. |

## Risco residual mais importante

O ponto tecnico que ainda merece atencao antes de considerar a plataforma "blindada" e este:

- a migracao do portfolio para bucket privado depende de aplicar `supabase/sql/add_portfolio_private_media.sql` no ambiente alvo;
- enquanto esse SQL nao for aplicado, o comportamento seguro novo fica pronto no codigo, mas o bucket antigo pode continuar exposto conforme o estado atual do banco;
- depois de aplicar o SQL, a vitrine publica passa a depender de signed URLs e o gargalo principal volta a ser o teste real de producao com Stripe e webhooks.

## Caminho correto para eliminar esse risco

1. aplicar `supabase/sql/add_portfolio_private_media.sql`;
2. publicar pelo menos uma obra nova para validar o caminho `obras/{userId}/{obraId}/...`;
3. confirmar que obra bloqueada some da vitrine e deixa de gerar signed URL publica;
4. validar dashboard do pintor, perfil publico e moderacao admin no mesmo ambiente.

## Proximo teste obrigatorio

Antes da publicacao, rode o checklist em `docs/plataforma-go-live-checklist.md` com:

- RLS ativa em todas as tabelas e buckets;
- um pintor real;
- um cliente real;
- um admin real;
- Stripe e Edge Functions configurados no ambiente alvo.
