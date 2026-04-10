-- ============================================================
-- MULTIPLOS TIPOS DE TINTA NO ORCAMENTO
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS pintura_tintas JSONB DEFAULT '[]'::jsonb;

UPDATE public.orcamentos
SET pintura_tintas = jsonb_build_array(pintura_tinta)
WHERE (pintura_tintas IS NULL OR pintura_tintas = '[]'::jsonb)
  AND pintura_tinta IS NOT NULL
  AND btrim(pintura_tinta) <> '';
