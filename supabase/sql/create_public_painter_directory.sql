-- ============================================================
-- DIRETORIO PUBLICO DE PINTORES APROVADOS
-- Execute este script no SQL Editor do Supabase.
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

CREATE INDEX IF NOT EXISTS idx_applications_last_seen_at
  ON public.applications(last_seen_at DESC);

CREATE OR REPLACE VIEW public.painter_directory_public AS
SELECT
  a.id,
  a.full_name AS name,
  CASE
    WHEN COALESCE(NULLIF(TRIM(a.city), ''), '') = '' THEN 'Localização não informada'
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
      '. Experiência: ' || TRIM(a.experience_time) || '.'
    WHEN COALESCE(array_length(a.specialties, 1), 0) > 0 THEN
      'Especialidades: ' ||
      array_to_string(a.specialties[1:LEAST(array_length(a.specialties, 1), 3)], ', ') || '.'
    WHEN COALESCE(NULLIF(TRIM(a.experience_time), ''), '') <> '' THEN
      'Experiência: ' || TRIM(a.experience_time) || '.'
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
  a.facebook_url AS facebook_url,
  a.street,
  a.neighborhood,
  a.address_number
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

