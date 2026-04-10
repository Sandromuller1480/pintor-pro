-- ============================================================
-- CAMPOS DE VALORES PARA ORCAMENTOS
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS valor_materiais NUMERIC(12,2);

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS valor_deslocamento NUMERIC(12,2);

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS valor_ajuste_extra NUMERIC(12,2);

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC(12,2);

ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS valor_total NUMERIC(12,2);
