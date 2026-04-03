-- ============================================================
-- MODERACAO ADMINISTRATIVA DO PORTFOLIO
-- Execute este script no SQL Editor do Supabase.
-- Adiciona colunas para controlar visibilidade publica e
-- status administrativo das obras do portfolio.
-- ============================================================

ALTER TABLE public.obras
ADD COLUMN IF NOT EXISTS is_publicly_visible BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.obras
ADD COLUMN IF NOT EXISTS featured_in_showcase BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.obras
ADD COLUMN IF NOT EXISTS admin_review_status TEXT NOT NULL DEFAULT 'approved';

ALTER TABLE public.obras
ADD COLUMN IF NOT EXISTS admin_review_notes TEXT;

ALTER TABLE public.obras
ADD COLUMN IF NOT EXISTS admin_reviewed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_obras_public_visibility
  ON public.obras(is_publicly_visible, admin_review_status);
