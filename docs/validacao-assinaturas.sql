-- Q1: Catalogo de planos
select
  code,
  display_name,
  billing_cycle,
  amount_cents,
  currency,
  active,
  sort_order,
  created_at,
  updated_at
from subscription_plans
order by sort_order asc;

-- Q2: Ultimas sessoes de checkout
select
  id,
  provider_session_id,
  provider_customer_id,
  customer_email,
  plan_code,
  status,
  checkout_url,
  application_id,
  created_at,
  updated_at
from billing_checkout_sessions
order by created_at desc
limit 20;

-- Q3: Ultimos eventos de webhook
select
  provider_event_id,
  event_type,
  livemode,
  processing_error,
  processed_at,
  created_at
from billing_webhook_events
order by created_at desc
limit 30;

-- Q4: Assinaturas consolidadas
select
  id,
  provider_subscription_id,
  provider_customer_id,
  customer_email,
  plan_code,
  status,
  cancel_at_period_end,
  current_period_start,
  current_period_end,
  canceled_at,
  created_at,
  updated_at
from billing_subscriptions
order by created_at desc
limit 20;

-- Q5: Reflexo da assinatura no cadastro (applications)
select
  id,
  full_name,
  email,
  status as application_status,
  subscription_plan,
  subscription_status,
  subscription_started_at,
  subscription_ends_at,
  stripe_customer_id,
  stripe_subscription_id,
  created_at
from applications
order by created_at desc
limit 30;

-- Q6: Checkout sem finalizacao (mais de 10 minutos)
select
  provider_session_id,
  customer_email,
  plan_code,
  status,
  created_at,
  updated_at
from billing_checkout_sessions
where status <> 'completed'
  and created_at < now() - interval '10 minutes'
order by created_at desc;

-- Q7: Webhooks com erro de processamento
select
  provider_event_id,
  event_type,
  processing_error,
  created_at
from billing_webhook_events
where processing_error is not null
order by created_at desc;

-- Q8: Assinaturas sem espelho em applications por email
select
  s.customer_email,
  s.provider_subscription_id,
  s.status as subscription_status,
  a.id as application_id,
  a.subscription_status as application_subscription_status
from billing_subscriptions s
left join applications a
  on lower(a.email) = lower(s.customer_email)
where a.id is null
   or a.stripe_subscription_id is distinct from s.provider_subscription_id
   or a.subscription_status is distinct from s.status
order by s.created_at desc;

-- Q9: Linha do tempo unificada por email (troque o email abaixo)
-- Substitua 'email@teste.com' antes de rodar.
with target as (
  select lower('email@teste.com') as email
)
select
  'checkout_session' as source,
  c.customer_email as email,
  c.plan_code as plan,
  c.status,
  c.created_at as event_time,
  c.provider_session_id as ref_id
from billing_checkout_sessions c
join target t on lower(c.customer_email) = t.email

union all

select
  'subscription' as source,
  s.customer_email as email,
  s.plan_code as plan,
  s.status,
  s.updated_at as event_time,
  s.provider_subscription_id as ref_id
from billing_subscriptions s
join target t on lower(s.customer_email) = t.email

union all

select
  'application' as source,
  a.email,
  a.subscription_plan as plan,
  a.subscription_status as status,
  a.created_at as event_time,
  a.id::text as ref_id
from applications a
join target t on lower(a.email) = t.email

order by event_time desc;
