-- ============================================================
-- DIRETORIO PUBLICO DE PINTORES APROVADOS
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.painter_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
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

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT false;

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
  (
    COALESCE(a.is_online, false)
    AND COALESCE(
      a.last_seen_at >= timezone('utc'::text, now()) - interval '3 minutes',
      false
    )
  ) AS is_online
FROM public.applications AS a
WHERE a.status = 'accepted';

GRANT SELECT ON public.painter_directory_public TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read approved application profile photos" ON storage.objects;
CREATE POLICY "Public can read approved application profile photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'application-work-photos'
  AND (storage.foldername(name))[2] = 'profile-photo'
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.status = 'accepted'
  )
);
