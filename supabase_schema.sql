
-- Extensao para UUIDs (necessaria para uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela para os pintores (Existente)
CREATE TABLE IF NOT EXISTS painters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  rating FLOAT DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  description TEXT,
  verified BOOLEAN DEFAULT false,
  top_rated BOOLEAN DEFAULT false,
  response_time TEXT,
  avatar TEXT,
  banner TEXT,
  specialties TEXT[], 
  lat FLOAT,
  lng FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Nova tabela para solicitacoes de credenciamento
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  gender TEXT,
  cep TEXT,
  city TEXT NOT NULL,
  uf TEXT,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL, -- Adicionado para notificacoes
  experience_time TEXT,
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  work_photo_paths TEXT[] DEFAULT ARRAY[]::TEXT[],
  certification_paths TEXT[] DEFAULT ARRAY[]::TEXT[],
  work_photo_count INTEGER DEFAULT 0,
  certification_count INTEGER DEFAULT 0,
  category_level TEXT, -- ouro, prata, bronze
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  analysis_notes TEXT,
  notification_email_status TEXT DEFAULT 'pending',
  notification_email_provider TEXT,
  notification_email_provider_id TEXT,
  notification_email_error TEXT,
  notification_email_sent_at TIMESTAMP WITH TIME ZONE,
  notification_email_last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Colunas de compatibilidade que precisam existir antes das policies
ALTER TABLE applications ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS profile_photo_path TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS foto_perfil TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS foto_capa TEXT;

-- Politicas para envio publico de credenciamento (MVP)
-- O signUp pode autenticar o usuario imediatamente, entao o cadastro precisa
-- funcionar tanto para anon quanto para authenticated.
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can insert applications" ON applications;
DROP POLICY IF EXISTS "Public can insert applications" ON applications;
CREATE POLICY "Public can insert applications"
ON applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update applications" ON applications;
DROP POLICY IF EXISTS "Public can update applications" ON applications;
CREATE POLICY "Public can update applications"
ON applications FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read own applications" ON applications;
CREATE POLICY "Authenticated users can read own applications"
ON applications FOR SELECT
TO authenticated
USING (
  auth_user_id = auth.uid()
  OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);
-- Compatibilidade para bancos ja criados anteriormente
ALTER TABLE applications ADD COLUMN IF NOT EXISTS experience_time TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE applications ADD COLUMN IF NOT EXISTS work_photo_paths TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE applications ADD COLUMN IF NOT EXISTS certification_paths TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE applications ADD COLUMN IF NOT EXISTS work_photo_count INTEGER DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS certification_count INTEGER DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS category_level TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notification_email_status TEXT DEFAULT 'pending';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notification_email_provider TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notification_email_provider_id TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notification_email_error TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notification_email_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notification_email_last_attempt_at TIMESTAMP WITH TIME ZONE;

UPDATE applications AS a
SET auth_user_id = u.id
FROM auth.users AS u
WHERE a.auth_user_id IS NULL
  AND lower(a.email) = lower(u.email);

-- Buckets para uploads do credenciamento (MVP)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('application-work-photos', 'application-work-photos', false),
  ('application-certifications', 'application-certifications', false)
ON CONFLICT (id) DO NOTHING;

-- Politicas minimas para upload via cliente (revisar em producao)
DROP POLICY IF EXISTS "Anon can upload application work photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload application work photos" ON storage.objects;
CREATE POLICY "Public can upload application work photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'application-work-photos');

DROP POLICY IF EXISTS "Authenticated users can read own application work photos" ON storage.objects;
CREATE POLICY "Authenticated users can read own application work photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-work-photos'
  AND EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND (
        a.auth_user_id = auth.uid()
        OR lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

DROP POLICY IF EXISTS "Anon can upload application certifications" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload application certifications" ON storage.objects;
CREATE POLICY "Public can upload application certifications"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'application-certifications');

-- Inserir dados iniciais (opcional)
INSERT INTO painters (name, location, rating, reviews_count, description, verified, top_rated, response_time, avatar, banner, specialties, lat, lng)
VALUES 
('Roberto Silva', 'Sao Paulo - SP', 4.9, 124, 'Especialista em pintura imobiliaria de alto padrao e texturas decorativas. 15 anos de experiencia.', true, true, 'menos de 1 hora', 'https://picsum.photos/seed/rob/200/200', 'https://picsum.photos/seed/rob_banner/800/300', ARRAY['Laca', 'Cimento Queimado', 'Pintura Epoxi'], -23.5505, -46.6333),
('Maria Fernanda', 'Curitiba - PR', 5.0, 89, 'Especialista em restauracao de fachadas e acabamentos finos. Certificada pelas melhores marcas.', true, true, '15 minutos', 'https://picsum.photos/seed/mari/200/200', 'https://picsum.photos/seed/mari_banner/800/300', ARRAY['Acabamentos Finos', 'Verniz', 'Pintura Airless'], -25.4290, -49.2671);

-- ===========================================
-- Billing: assinatura recorrente (Stripe)
-- ===========================================

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS subscription_plans (
  code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS billing_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS billing_checkout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_session_id TEXT NOT NULL UNIQUE,
  provider_customer_id TEXT,
  customer_email TEXT NOT NULL,
  plan_code TEXT NOT NULL REFERENCES subscription_plans(code),
  status TEXT NOT NULL DEFAULT 'created',
  checkout_url TEXT,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_subscription_id TEXT NOT NULL UNIQUE,
  provider_customer_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  plan_code TEXT NOT NULL REFERENCES subscription_plans(code),
  status TEXT NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  livemode BOOLEAN NOT NULL DEFAULT false,
  payload JSONB NOT NULL,
  processing_error TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_subscription_plans_updated_at'
  ) THEN
    CREATE TRIGGER set_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_billing_customers_updated_at'
  ) THEN
    CREATE TRIGGER set_billing_customers_updated_at
    BEFORE UPDATE ON billing_customers
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_billing_checkout_sessions_updated_at'
  ) THEN
    CREATE TRIGGER set_billing_checkout_sessions_updated_at
    BEFORE UPDATE ON billing_checkout_sessions
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at_timestamp();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_billing_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER set_billing_subscriptions_updated_at
    BEFORE UPDATE ON billing_subscriptions
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at_timestamp();
  END IF;
END
$$;

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can read active subscription plans" ON subscription_plans;
CREATE POLICY "Anon can read active subscription plans"
ON subscription_plans
FOR SELECT
TO anon
USING (active = true);

ALTER TABLE applications ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'bronze';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_auth_user_id ON applications(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_customer_email ON billing_subscriptions(customer_email);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status ON billing_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_checkout_sessions_email ON billing_checkout_sessions(customer_email);

INSERT INTO subscription_plans (code, display_name, billing_cycle, amount_cents, currency, active, sort_order)
VALUES
  ('bronze', 'Bronze', 'monthly', 0, 'BRL', true, 1),
  ('silver', 'Elite Silver', 'monthly', 4900, 'BRL', true, 2),
  ('pro', 'PINTOR PRO', 'monthly', 9700, 'BRL', true, 3)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  billing_cycle = EXCLUDED.billing_cycle,
  amount_cents = EXCLUDED.amount_cents,
  currency = EXCLUDED.currency,
  active = EXCLUDED.active,
  sort_order = EXCLUDED.sort_order,
  updated_at = timezone('utc'::text, now());

-- ===========================================
-- Diretorio publico de pintores aprovados
-- ===========================================

CREATE OR REPLACE VIEW public.painter_directory_public AS
SELECT
  a.id,
  a.full_name AS name,
  CASE
    WHEN COALESCE(NULLIF(TRIM(a.city), ''), '') = '' THEN 'Localizacao nao informada'
    WHEN COALESCE(NULLIF(TRIM(a.uf), ''), '') = '' THEN TRIM(a.city)
    ELSE TRIM(a.city) || ' - ' || TRIM(a.uf)
  END AS location,
  0::float AS rating,
  0::integer AS reviews_count,
  CASE
    WHEN COALESCE(array_length(a.specialties, 1), 0) > 0 AND COALESCE(NULLIF(TRIM(a.experience_time), ''), '') <> '' THEN
      'Especialidades: ' ||
      array_to_string(a.specialties[1:LEAST(array_length(a.specialties, 1), 3)], ', ') ||
      '. Experiencia: ' || TRIM(a.experience_time) || '.'
    WHEN COALESCE(array_length(a.specialties, 1), 0) > 0 THEN
      'Especialidades: ' ||
      array_to_string(a.specialties[1:LEAST(array_length(a.specialties, 1), 3)], ', ') || '.'
    WHEN COALESCE(NULLIF(TRIM(a.experience_time), ''), '') <> '' THEN
      'Experiencia: ' || TRIM(a.experience_time) || '.'
    ELSE
      'Perfil profissional ativo na PINTOR PRO.'
  END AS description,
  true AS verified,
  (COALESCE(a.category_level, '') = 'ouro' OR COALESCE(a.subscription_plan, '') = 'pro') AS top_rated,
  'sob consulta'::text AS response_time,
  a.foto_perfil AS avatar,
  a.foto_capa AS banner,
  COALESCE(a.specialties, ARRAY[]::text[]) AS specialties,
  a.created_at
FROM public.applications AS a
WHERE a.status = 'accepted';

GRANT SELECT ON public.painter_directory_public TO anon, authenticated;

