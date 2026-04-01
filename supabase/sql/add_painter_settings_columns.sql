-- ============================================================
-- CONFIGURACOES OPERACIONAIS DO PINTOR
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

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
  ) AS is_online,
  a.last_seen_at,
  COALESCE(a.allow_chat, true) AS allow_chat,
  COALESCE(a.allow_visit_requests, true) AS allow_visit_requests,
  COALESCE(a.pause_lead_intake, false) AS pause_lead_intake
FROM public.applications AS a
WHERE a.status = 'accepted';

GRANT SELECT ON public.painter_directory_public TO anon, authenticated;
