-- Billing + Stripe Checkout para assinaturas Pintor Pro.
-- Rode este script no SQL Editor do Supabase depois que public.applications ja existir.
-- Os Price IDs do Stripe ficam nos secrets das Edge Functions:
-- STRIPE_PRICE_MONTHLY e STRIPE_PRICE_ANNUAL.
-- O plano trial e gratuito e nao passa pelo Stripe.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('trial', 'monthly', 'annual')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscription_plans
DROP CONSTRAINT IF EXISTS subscription_plans_billing_cycle_check;

ALTER TABLE public.subscription_plans
ADD CONSTRAINT subscription_plans_billing_cycle_check
CHECK (billing_cycle IN ('trial', 'monthly', 'annual'));

ALTER TABLE public.subscription_plans
DROP CONSTRAINT IF EXISTS subscription_plans_amount_cents_check;

ALTER TABLE public.subscription_plans
ADD CONSTRAINT subscription_plans_amount_cents_check
CHECK (amount_cents >= 0);

DROP TRIGGER IF EXISTS set_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER set_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.subscription_plans (
  code,
  display_name,
  billing_cycle,
  amount_cents,
  currency,
  active,
  sort_order
) VALUES
  ('trial', 'Teste gratuito 30 dias', 'trial', 0, 'BRL', TRUE, 0),
  ('monthly', 'Plano mensal', 'monthly', 5000, 'BRL', TRUE, 10),
  ('annual', 'Plano anual', 'annual', 50000, 'BRL', TRUE, 20)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  billing_cycle = EXCLUDED.billing_cycle,
  amount_cents = EXCLUDED.amount_cents,
  currency = EXCLUDED.currency,
  active = EXCLUDED.active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS public.billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  stripe_customer_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_customers_email_unique UNIQUE (email),
  CONSTRAINT billing_customers_stripe_customer_id_unique UNIQUE (stripe_customer_id)
);

DROP TRIGGER IF EXISTS set_billing_customers_updated_at ON public.billing_customers;
CREATE TRIGGER set_billing_customers_updated_at
BEFORE UPDATE ON public.billing_customers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_billing_customers_email_lower
ON public.billing_customers (LOWER(email));

CREATE TABLE IF NOT EXISTS public.billing_checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_session_id TEXT NOT NULL,
  provider_customer_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  plan_code TEXT NOT NULL REFERENCES public.subscription_plans(code),
  status TEXT NOT NULL DEFAULT 'created',
  checkout_url TEXT,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_checkout_sessions_provider_session_unique UNIQUE (provider_session_id)
);

DROP TRIGGER IF EXISTS set_billing_checkout_sessions_updated_at ON public.billing_checkout_sessions;
CREATE TRIGGER set_billing_checkout_sessions_updated_at
BEFORE UPDATE ON public.billing_checkout_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_billing_checkout_sessions_customer_email_lower
ON public.billing_checkout_sessions (LOWER(customer_email));

CREATE INDEX IF NOT EXISTS idx_billing_checkout_sessions_application_id
ON public.billing_checkout_sessions (application_id);

CREATE INDEX IF NOT EXISTS idx_billing_checkout_sessions_created_at
ON public.billing_checkout_sessions (created_at DESC);

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_subscription_id TEXT NOT NULL,
  provider_customer_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  plan_code TEXT NOT NULL REFERENCES public.subscription_plans(code),
  status TEXT NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_subscriptions_provider_subscription_unique UNIQUE (provider_subscription_id)
);

DROP TRIGGER IF EXISTS set_billing_subscriptions_updated_at ON public.billing_subscriptions;
CREATE TRIGGER set_billing_subscriptions_updated_at
BEFORE UPDATE ON public.billing_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_customer_email_lower
ON public.billing_subscriptions (LOWER(customer_email));

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_provider_customer_id
ON public.billing_subscriptions (provider_customer_id);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status
ON public.billing_subscriptions (status);

CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  livemode BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_webhook_events_provider_event_unique UNIQUE (provider_event_id)
);

DROP TRIGGER IF EXISTS set_billing_webhook_events_updated_at ON public.billing_webhook_events;
CREATE TRIGGER set_billing_webhook_events_updated_at
BEFORE UPDATE ON public.billing_webhook_events
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_created_at
ON public.billing_webhook_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_event_type
ON public.billing_webhook_events (event_type);

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_applications_subscription_status
ON public.applications (subscription_status);

CREATE INDEX IF NOT EXISTS idx_applications_stripe_customer_id
ON public.applications (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_applications_stripe_subscription_id
ON public.applications (stripe_subscription_id);

CREATE OR REPLACE FUNCTION public.start_painter_trial(p_application_id UUID)
RETURNS TABLE (
  subscription_plan TEXT,
  subscription_status TEXT,
  subscription_ends_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_application RECORD;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario autenticado obrigatorio.';
  END IF;

  SELECT
    id,
    email,
    auth_user_id,
    subscription_plan,
    subscription_status,
    subscription_ends_at
  INTO v_application
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cadastro nao encontrado.';
  END IF;

  IF COALESCE(v_application.auth_user_id::TEXT, '') <> auth.uid()::TEXT
    AND LOWER(COALESCE(v_application.email, '')) <> LOWER(COALESCE(auth.email(), '')) THEN
    RAISE EXCEPTION 'Sem permissao para ativar o teste deste cadastro.';
  END IF;

  IF LOWER(COALESCE(v_application.subscription_plan, '')) = 'trial'
    OR LOWER(COALESCE(v_application.subscription_status, '')) = 'trialing' THEN
    RAISE EXCEPTION 'Teste gratuito ja utilizado neste cadastro.';
  END IF;

  IF LOWER(COALESCE(v_application.subscription_status, '')) = 'active'
    AND (v_application.subscription_ends_at IS NULL OR v_application.subscription_ends_at > v_now) THEN
    RAISE EXCEPTION 'Este cadastro ja possui assinatura ativa.';
  END IF;

  UPDATE public.applications
  SET
    subscription_plan = 'trial',
    subscription_status = 'trialing',
    subscription_started_at = v_now,
    subscription_ends_at = v_now + INTERVAL '30 days'
  WHERE id = p_application_id
  RETURNING
    applications.subscription_plan,
    applications.subscription_status,
    applications.subscription_ends_at
  INTO
    subscription_plan,
    subscription_status,
    subscription_ends_at;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_painter_trial(UUID) TO authenticated;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can read active subscription plans"
ON public.subscription_plans
FOR SELECT
TO anon, authenticated
USING (active = TRUE);

DROP POLICY IF EXISTS "Users can read own billing customers" ON public.billing_customers;
CREATE POLICY "Users can read own billing customers"
ON public.billing_customers
FOR SELECT
TO authenticated
USING (LOWER(email) = LOWER(auth.email()));

DROP POLICY IF EXISTS "Users can read own checkout sessions" ON public.billing_checkout_sessions;
CREATE POLICY "Users can read own checkout sessions"
ON public.billing_checkout_sessions
FOR SELECT
TO authenticated
USING (LOWER(customer_email) = LOWER(auth.email()));

DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.billing_subscriptions;
CREATE POLICY "Users can read own subscriptions"
ON public.billing_subscriptions
FOR SELECT
TO authenticated
USING (LOWER(customer_email) = LOWER(auth.email()));

GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT SELECT ON public.billing_customers TO authenticated;
GRANT SELECT ON public.billing_checkout_sessions TO authenticated;
GRANT SELECT ON public.billing_subscriptions TO authenticated;
