-- =========================================================================
-- GESTAO DE EQUIPE DO PINTOR
-- Execute isso no SQL Editor do seu Supabase.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.painter_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    painter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('pintor_profissional', 'ajudante')),
    phone TEXT,
    daily_rate NUMERIC(12,2),
    has_nr35 BOOLEAN NOT NULL DEFAULT false,
    nr35_expiration_date DATE,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    specialties TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_painter_team_members_painter_id
  ON public.painter_team_members(painter_id);

ALTER TABLE public.painter_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pintor pode inserir membros da equipe" ON public.painter_team_members;
CREATE POLICY "Pintor pode inserir membros da equipe"
ON public.painter_team_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = painter_id);

DROP POLICY IF EXISTS "Pintor pode ver membros da equipe" ON public.painter_team_members;
CREATE POLICY "Pintor pode ver membros da equipe"
ON public.painter_team_members FOR SELECT
TO authenticated
USING (auth.uid() = painter_id);

DROP POLICY IF EXISTS "Pintor pode atualizar membros da equipe" ON public.painter_team_members;
CREATE POLICY "Pintor pode atualizar membros da equipe"
ON public.painter_team_members FOR UPDATE
TO authenticated
USING (auth.uid() = painter_id)
WITH CHECK (auth.uid() = painter_id);

DROP POLICY IF EXISTS "Pintor pode excluir membros da equipe" ON public.painter_team_members;
CREATE POLICY "Pintor pode excluir membros da equipe"
ON public.painter_team_members FOR DELETE
TO authenticated
USING (auth.uid() = painter_id);
