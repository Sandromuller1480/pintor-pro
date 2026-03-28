# Plano Tecnico de Assinaturas (7 dias)

## Arquitetura escolhida
- Frontend: React + Vite (pagina `planos`)
- Backend: Supabase Edge Functions
- Gateway: Stripe Billing (checkout hospedado + webhooks)
- Persistencia: tabelas SQL no Supabase

## Objetivo
- Cobrar planos recorrentes `silver` e `pro`
- Confirmar assinatura via webhook (fonte de verdade)
- Refletir status no banco e no cadastro (`applications`)

## Modelagem criada no banco
- `subscription_plans`: catalogo de planos
- `billing_customers`: email + customer id do Stripe
- `billing_checkout_sessions`: sessoes de checkout criadas
- `billing_subscriptions`: assinatura ativa/inadimplente/cancelada
- `billing_webhook_events`: trilha de eventos recebidos
- `applications` recebeu colunas:
  - `subscription_plan`
  - `subscription_status`
  - `subscription_started_at`
  - `subscription_ends_at`
  - `stripe_customer_id`
  - `stripe_subscription_id`

## Funcoes criadas
- `create-checkout-session`
  - valida plano e email
  - cria/recupera cliente no Stripe
  - cria checkout de assinatura
  - grava cliente/sessao no Supabase
- `stripe-webhook`
  - valida assinatura do webhook (`Stripe-Signature`)
  - salva evento bruto no banco
  - sincroniza assinatura e status no Supabase
  - atualiza `applications` por email

## Variaveis de ambiente (Supabase Edge Functions)
Defina no projeto Supabase:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_SILVER_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
APP_BASE_URL=https://seu-dominio.com
```

## Deploy recomendado
1. Aplicar SQL (`supabase/sql/supabase_schema.sql`) no banco.
2. Subir secrets:
```bash
supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... STRIPE_PRICE_SILVER_MONTHLY=... STRIPE_PRICE_PRO_MONTHLY=... APP_BASE_URL=...
```
3. Deploy das funcoes:
```bash
supabase functions deploy create-checkout-session --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
```
4. No Stripe Dashboard, criar webhook para:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

URL do webhook:
`https://<project-ref>.supabase.co/functions/v1/stripe-webhook`

## Cronograma de 7 dias
1. Dia 1: aplicar schema, criar produtos/precos no Stripe, setar secrets.
2. Dia 2: deploy das funcoes e teste local de checkout.
3. Dia 3: configurar webhook e validar assinatura em ambiente de teste.
4. Dia 4: validar atualizacao de `billing_subscriptions` e `applications`.
5. Dia 5: fechar regras de negocio (acesso por plano, cancelamento, retry).
6. Dia 6: homologacao com 3 cenarios (novo, inadimplente, cancelado).
7. Dia 7: virar para producao, monitorar eventos e funil de conversao.

## Checklist de homologacao
- Checkout redireciona corretamente para Stripe
- Retorno `?checkout=success` e `?checkout=canceled` no front
- Webhook grava evento em `billing_webhook_events`
- Assinatura atualiza em `billing_subscriptions`
- `applications` reflete plano/status correto por email
- Cancelamento no Stripe aparece no banco em poucos segundos
