-- ============================================================
-- LINKS DE REDES SOCIAIS DO PINTOR
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS facebook_url TEXT;
