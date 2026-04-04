-- ============================================================
-- PERMITIR EXCLUSAO DE ORCAMENTOS PELO PROPRIO PINTOR
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pintor pode deletar seus orcamentos" ON public.orcamentos;
CREATE POLICY "Pintor pode deletar seus orcamentos"
ON public.orcamentos FOR DELETE
TO authenticated
USING (auth.uid() = pintor_id);
