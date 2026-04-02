-- ============================================================
-- VISUALIZACOES PUBLICAS DO PERFIL DO PINTOR
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
