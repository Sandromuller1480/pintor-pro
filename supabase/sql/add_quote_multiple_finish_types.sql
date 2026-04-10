-- ============================================================
-- MULTIPLOS TIPOS DE ACABAMENTO NO ORCAMENTO
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS pintura_acabamentos JSONB DEFAULT '[]'::jsonb;

UPDATE public.orcamentos
SET pintura_acabamentos = jsonb_build_array(pintura_acabamento)
WHERE (pintura_acabamentos IS NULL OR pintura_acabamentos = '[]'::jsonb)
  AND pintura_acabamento IS NOT NULL
  AND btrim(pintura_acabamento) <> '';
