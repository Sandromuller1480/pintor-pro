-- ============================================================
-- CONSOLIDADO DA VITRINE PUBLICA, PRESENCA E CONFIGURACOES
-- Este arquivo NAO substitui os schemas base de clientes,
-- portfolio, orcamentos, agenda e chat.
-- Ele centraliza reviews, profile views, presenca online,
-- configuracoes operacionais e a view publica de pintores.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.painter_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  client_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_avatar_url TEXT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_painter_reviews_application_id
  ON public.painter_reviews(application_id);

CREATE INDEX IF NOT EXISTS idx_painter_reviews_created_at
  ON public.painter_reviews(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_painter_reviews_application_client
  ON public.painter_reviews(application_id, client_auth_user_id);

ALTER TABLE public.painter_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read reviews for accepted painters" ON public.painter_reviews;
CREATE POLICY "Public can read reviews for accepted painters"
ON public.painter_reviews FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_reviews.application_id
      AND a.status = 'accepted'
  )
);

GRANT SELECT ON public.painter_reviews TO anon, authenticated;
DROP POLICY IF EXISTS "Clients can insert own reviews for accepted painters" ON public.painter_reviews;
CREATE POLICY "Clients can insert own reviews for accepted painters"
ON public.painter_reviews FOR INSERT
TO authenticated
WITH CHECK (
  client_auth_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.clientes AS c
    WHERE c.auth_user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_reviews.application_id
      AND a.status = 'accepted'
      AND a.auth_user_id IS DISTINCT FROM auth.uid()
  )
);

DROP POLICY IF EXISTS "Clients can update own reviews" ON public.painter_reviews;
CREATE POLICY "Clients can update own reviews"
ON public.painter_reviews FOR UPDATE
TO authenticated
USING (
  client_auth_user_id = auth.uid()
)
WITH CHECK (
  client_auth_user_id = auth.uid()
);

GRANT INSERT, UPDATE ON public.painter_reviews TO authenticated;

CREATE TABLE IF NOT EXISTS public.client_favorite_painters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_favorite_painters_unique
  ON public.client_favorite_painters(client_auth_user_id, application_id);

CREATE INDEX IF NOT EXISTS idx_client_favorite_painters_application_id
  ON public.client_favorite_painters(application_id);

ALTER TABLE public.client_favorite_painters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can read own favorite painters" ON public.client_favorite_painters;
CREATE POLICY "Clients can read own favorite painters"
ON public.client_favorite_painters FOR SELECT
TO authenticated
USING (
  client_auth_user_id = auth.uid()
);

DROP POLICY IF EXISTS "Clients can insert own favorite painters" ON public.client_favorite_painters;
CREATE POLICY "Clients can insert own favorite painters"
ON public.client_favorite_painters FOR INSERT
TO authenticated
WITH CHECK (
  client_auth_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.clientes AS c
    WHERE c.auth_user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = client_favorite_painters.application_id
      AND a.status = 'accepted'
      AND a.auth_user_id IS DISTINCT FROM auth.uid()
  )
);

DROP POLICY IF EXISTS "Clients can delete own favorite painters" ON public.client_favorite_painters;
CREATE POLICY "Clients can delete own favorite painters"
ON public.client_favorite_painters FOR DELETE
TO authenticated
USING (
  client_auth_user_id = auth.uid()
);

GRANT SELECT, INSERT, DELETE ON public.client_favorite_painters TO authenticated;

CREATE TABLE IF NOT EXISTS public.painter_profile_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  client_auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'native',
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_painter_profile_shares_application_id
  ON public.painter_profile_shares(application_id);

CREATE INDEX IF NOT EXISTS idx_painter_profile_shares_shared_at
  ON public.painter_profile_shares(shared_at DESC);

ALTER TABLE public.painter_profile_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can insert own profile shares" ON public.painter_profile_shares;
CREATE POLICY "Clients can insert own profile shares"
ON public.painter_profile_shares FOR INSERT
TO authenticated
WITH CHECK (
  client_auth_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.clientes AS c
    WHERE c.auth_user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_profile_shares.application_id
      AND a.status = 'accepted'
      AND a.auth_user_id IS DISTINCT FROM auth.uid()
  )
);

DROP POLICY IF EXISTS "Painters can read own profile shares" ON public.painter_profile_shares;
CREATE POLICY "Painters can read own profile shares"
ON public.painter_profile_shares FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_profile_shares.application_id
      AND a.auth_user_id = auth.uid()
  )
);

GRANT INSERT, SELECT ON public.painter_profile_shares TO authenticated;

CREATE TABLE IF NOT EXISTS public.painter_profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  viewer_key TEXT NOT NULL,
  view_bucket DATE NOT NULL DEFAULT (timezone('utc'::text, now())::date),
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_painter_profile_views_unique_daily
  ON public.painter_profile_views(application_id, viewer_key, view_bucket);

CREATE INDEX IF NOT EXISTS idx_painter_profile_views_application_id
  ON public.painter_profile_views(application_id);

CREATE INDEX IF NOT EXISTS idx_painter_profile_views_viewed_at
  ON public.painter_profile_views(viewed_at DESC);

ALTER TABLE public.painter_profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert profile views for accepted painters" ON public.painter_profile_views;
CREATE POLICY "Public can insert profile views for accepted painters"
ON public.painter_profile_views FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_profile_views.application_id
      AND a.status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Painters can read their own profile views" ON public.painter_profile_views;
CREATE POLICY "Painters can read their own profile views"
ON public.painter_profile_views FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_profile_views.application_id
      AND a.auth_user_id = auth.uid()
  )
);

GRANT INSERT ON public.painter_profile_views TO anon, authenticated;
GRANT SELECT ON public.painter_profile_views TO authenticated;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS allow_chat BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS allow_visit_requests BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS pause_lead_intake BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS daily_summary_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS business_hours_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS working_days TEXT[] NOT NULL DEFAULT ARRAY['1', '2', '3', '4', '5']::text[];

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS working_hours_start TEXT NOT NULL DEFAULT '08:00';

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS working_hours_end TEXT NOT NULL DEFAULT '18:00';

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS service_timezone TEXT NOT NULL DEFAULT 'America/Cuiaba';

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS facebook_url TEXT;

CREATE INDEX IF NOT EXISTS idx_applications_last_seen_at
  ON public.applications(last_seen_at DESC);

CREATE OR REPLACE VIEW public.painter_directory_public AS
SELECT
  a.id,
  a.full_name AS name,
  CASE
    WHEN COALESCE(NULLIF(TRIM(a.city), ''), '') = '' THEN 'Localizacao nao informada'
    WHEN COALESCE(NULLIF(TRIM(a.uf), ''), '') = '' THEN TRIM(a.city)
    ELSE TRIM(a.city) || ' - ' || TRIM(a.uf)
  END AS location,
  COALESCE((
    SELECT ROUND(AVG(pr.rating)::numeric, 1)::float
    FROM public.painter_reviews AS pr
    WHERE pr.application_id = a.id
  ), 0::float) AS rating,
  (
    SELECT COUNT(*)::integer
    FROM public.painter_reviews AS pr
    WHERE pr.application_id = a.id
  ) AS reviews_count,
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
  a.created_at,
  a.profile_photo_path AS legacy_avatar_path,
  a.auth_user_id AS portfolio_owner_id,
  a.experience_time,
  a.category_level,
  a.subscription_plan,
  a.gender,
  COALESCE(a.is_online, false) AS is_online,
  a.last_seen_at,
  COALESCE(a.allow_chat, true) AS allow_chat,
  COALESCE(a.allow_visit_requests, true) AS allow_visit_requests,
  COALESCE(a.pause_lead_intake, false) AS pause_lead_intake,
  COALESCE(a.business_hours_enabled, false) AS business_hours_enabled,
  COALESCE(a.working_days, ARRAY['1', '2', '3', '4', '5']::text[]) AS working_days,
  COALESCE(a.working_hours_start, '08:00'::text) AS working_hours_start,
  COALESCE(a.working_hours_end, '18:00'::text) AS working_hours_end,
  COALESCE(a.service_timezone, 'America/Cuiaba'::text) AS service_timezone,
  a.whatsapp AS whatsapp,
  a.instagram_url AS instagram_url,
  a.facebook_url AS facebook_url
FROM public.applications AS a
WHERE a.status = 'accepted';

GRANT SELECT ON public.painter_directory_public TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read approved application profile photos" ON storage.objects;
CREATE POLICY "Public can read approved application profile photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'application-work-photos'
  AND (
    (storage.foldername(name))[2] = 'profile-photo'
    OR (storage.foldername(name))[3] = 'profile-photo'
  )
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.status = 'accepted'
  )
);
