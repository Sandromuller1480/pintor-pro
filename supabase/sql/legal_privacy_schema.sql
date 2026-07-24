-- ============================================================
-- MODULO JURIDICO, PRIVACIDADE, ACEITES E LGPD - PINTOR PRO
-- Aplicar manualmente no Supabase SQL Editor.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE public.legal_document_type AS ENUM (
    'terms_of_use',
    'privacy_policy',
    'cookie_policy',
    'community_guidelines'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.privacy_request_status AS ENUM (
    'received',
    'validating',
    'analyzing',
    'waiting_information',
    'completed',
    'denied'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.platform_settings (key, value, description)
VALUES (
  'hide_painter_profile_when_subscription_inactive',
  'true'::jsonb,
  'Oculta perfil publico do pintor quando a assinatura estiver inativa ou bloqueada.'
)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type public.legal_document_type NOT NULL,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  effective_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  requires_new_acceptance BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (document_type, version)
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_type_active
  ON public.legal_documents(document_type, is_active, effective_at DESC);

CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.legal_documents(id) ON DELETE RESTRICT,
  document_type public.legal_document_type NOT NULL,
  document_version TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  ip_address INET,
  user_agent TEXT,
  acceptance_method TEXT NOT NULL DEFAULT 'checkbox',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user
  ON public.legal_acceptances(user_id, accepted_at DESC);

CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol TEXT NOT NULL UNIQUE,
  requester_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  account_identifier TEXT,
  description TEXT NOT NULL,
  status public.privacy_request_status NOT NULL DEFAULT 'received',
  admin_notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_status_created
  ON public.privacy_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.privacy_request_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.privacy_requests(id) ON DELETE CASCADE,
  status public.privacy_request_status NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.privacy_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'under_review',
  affected_data TEXT,
  actions_taken TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.data_processors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  purpose TEXT NOT NULL,
  country TEXT,
  privacy_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.data_retention_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_category TEXT NOT NULL,
  purpose TEXT NOT NULL,
  retention_period TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  disposal_method TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active legal documents" ON public.legal_documents;
CREATE POLICY "Public can read active legal documents"
ON public.legal_documents FOR SELECT
TO anon, authenticated
USING (is_active = true AND (effective_at IS NULL OR effective_at <= timezone('utc'::text, now())));

DROP POLICY IF EXISTS "Users can read own legal acceptances" ON public.legal_acceptances;
CREATE POLICY "Users can read own legal acceptances"
ON public.legal_acceptances FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can accept only for themselves" ON public.legal_acceptances;
CREATE POLICY "Users can accept only for themselves"
ON public.legal_acceptances FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can create privacy request" ON public.privacy_requests;
CREATE POLICY "Anyone can create privacy request"
ON public.privacy_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own privacy requests" ON public.privacy_requests;
CREATE POLICY "Users can read own privacy requests"
ON public.privacy_requests FOR SELECT
TO authenticated
USING (
  requester_user_id = auth.uid()
  OR lower(requester_email) = lower((auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Public can read active processors" ON public.data_processors;
CREATE POLICY "Public can read active processors"
ON public.data_processors FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Public can read active retention rules" ON public.data_retention_rules;
CREATE POLICY "Public can read active retention rules"
ON public.data_retention_rules FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Public can read selected platform settings" ON public.platform_settings;
CREATE POLICY "Public can read selected platform settings"
ON public.platform_settings FOR SELECT
TO anon, authenticated
USING (key IN ('hide_painter_profile_when_subscription_inactive'));

GRANT SELECT ON public.legal_documents TO anon, authenticated;
GRANT SELECT, INSERT ON public.legal_acceptances TO authenticated;
GRANT INSERT ON public.privacy_requests TO anon, authenticated;
GRANT SELECT ON public.privacy_requests TO authenticated;
GRANT SELECT ON public.data_processors TO anon, authenticated;
GRANT SELECT ON public.data_retention_rules TO anon, authenticated;
GRANT SELECT ON public.platform_settings TO anon, authenticated;
