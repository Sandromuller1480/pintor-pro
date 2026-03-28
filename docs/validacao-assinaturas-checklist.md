# Checklist de Validacao de Assinaturas

Use junto com os arquivos SQL:
- `supabase/sql/supabase_schema.sql`
- `docs/validacao-assinaturas.sql`

## 1) Conferir catalogo de planos
- Rode a query `Q1`.
- Esperado:
  - `bronze` com `amount_cents = 0`
  - `silver` com `amount_cents = 4900`
  - `pro` com `amount_cents = 9700`
  - `active = true` para os tres

## 2) Fazer um checkout de teste
- Acesse `/planos`, informe email e clique em `Assinar Silver` ou `Seja um PRO`.
- No Stripe, conclua pagamento em modo teste.

## 3) Verificar sessao de checkout no banco
- Rode `Q2`.
- Esperado:
  - nova linha em `billing_checkout_sessions`
  - `status` deve virar `completed` apos webhook

## 4) Verificar eventos de webhook
- Rode `Q3`.
- Esperado:
  - eventos recentes `checkout.session.completed` e `customer.subscription.updated` (ou equivalentes)
  - `processing_error` deve estar `null`

## 5) Verificar assinatura consolidada
- Rode `Q4`.
- Esperado:
  - linha em `billing_subscriptions`
  - `status` em `active` para pagamento aprovado
  - `current_period_end` preenchido

## 6) Verificar reflexo no cadastro do pintor
- Rode `Q5`.
- Esperado:
  - `applications.subscription_status` sincronizado com o status da assinatura
  - `stripe_customer_id` e `stripe_subscription_id` preenchidos

## 7) Rodar diagnostico rapido se algo falhar
- Rode `Q6`, `Q7` e `Q8`.
- Esses blocos mostram:
  - sessoes sem webhook
  - webhooks com erro
  - assinaturas sem reflexo em `applications`

## Cenarios minimos para homologacao
- Assinatura nova aprovada
- Cancelamento (manual no Stripe)
- Falha de pagamento (`invoice.payment_failed`)
- Reativacao apos falha
