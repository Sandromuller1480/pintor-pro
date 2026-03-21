-- ============================================================
-- COLUNAS PARA FOTO DE PERFIL E FOTO DE CAPA DO PINTOR
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS foto_perfil TEXT;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS foto_capa TEXT;
