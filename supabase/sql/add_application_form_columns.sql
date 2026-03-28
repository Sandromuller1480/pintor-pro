-- ============================================================
-- COLUNAS DO FORMULARIO DE CREDENCIAMENTO DO PINTOR
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS cep TEXT;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS uf TEXT;
