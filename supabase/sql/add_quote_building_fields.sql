-- =========================================================================
-- CAMPOS DE EDIFICIO PARA ORCAMENTOS
-- Execute isso no SQL Editor do seu Supabase.
-- =========================================================================

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS edificio_nome TEXT;

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS edificio_total_pavimentos INTEGER;

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS edificio_pavimento_atendido TEXT;

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS edificio_possui_elevador TEXT;

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS edificio_tipo_atendimento TEXT;
