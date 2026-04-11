-- =========================================================================
-- CONTROLE FINANCEIRO DO PINTOR
-- Execute isso no SQL Editor do seu Supabase.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.painter_financial_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    painter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('entrada', 'saida')),
    title TEXT NOT NULL,
    category TEXT,
    related_client_name TEXT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'pago', 'cancelado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_painter_financial_entries_painter_id
  ON public.painter_financial_entries(painter_id);

CREATE INDEX IF NOT EXISTS idx_painter_financial_entries_entry_date
  ON public.painter_financial_entries(entry_date DESC);

ALTER TABLE public.painter_financial_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pintor pode inserir lancamentos financeiros" ON public.painter_financial_entries;
CREATE POLICY "Pintor pode inserir lancamentos financeiros"
ON public.painter_financial_entries FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = painter_id);

DROP POLICY IF EXISTS "Pintor pode ver lancamentos financeiros" ON public.painter_financial_entries;
CREATE POLICY "Pintor pode ver lancamentos financeiros"
ON public.painter_financial_entries FOR SELECT
TO authenticated
USING (auth.uid() = painter_id);

DROP POLICY IF EXISTS "Pintor pode atualizar lancamentos financeiros" ON public.painter_financial_entries;
CREATE POLICY "Pintor pode atualizar lancamentos financeiros"
ON public.painter_financial_entries FOR UPDATE
TO authenticated
USING (auth.uid() = painter_id)
WITH CHECK (auth.uid() = painter_id);

DROP POLICY IF EXISTS "Pintor pode excluir lancamentos financeiros" ON public.painter_financial_entries;
CREATE POLICY "Pintor pode excluir lancamentos financeiros"
ON public.painter_financial_entries FOR DELETE
TO authenticated
USING (auth.uid() = painter_id);
