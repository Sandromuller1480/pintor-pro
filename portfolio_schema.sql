-- =========================================================================
-- SCRIPT DE CRIAÇÃO DA TABELA "obras" (Portfólio) E BUCKET DE IMAGENS
-- Execute isso no SQL Editor do seu Supabase.
-- =========================================================================

-- 1. CRIAÇÃO DA TABELA DE OBRAS
CREATE TABLE IF NOT EXISTS public.obras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pintor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    titulo TEXT NOT NULL,
    local TEXT NOT NULL,
    tipo_imovel TEXT NOT NULL,
    tipo_pintura TEXT NOT NULL,
    status TEXT DEFAULT 'CONCLUÍDO', -- Pode ser 'CONCLUÍDO' ou 'EM ANDAMENTO'
    imagem_url TEXT, -- Caminho da imagem no storage
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. REGRAS DE SEGURANÇA (RLS) DA TABELA
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

-- Visitantes podem ver as obras (para o perfil público do pintor ficar visível na vitrine)
CREATE POLICY "Qualquer pessoa pode ver as obras"
ON public.obras FOR SELECT
USING (true);

-- O pintor logado pode criar, editar e deletar APENAS as suas próprias obras
CREATE POLICY "Pintores podem inserir suas obras"
ON public.obras FOR INSERT
WITH CHECK (auth.uid() = pintor_id);

CREATE POLICY "Pintores podem atualizar suas obras"
ON public.obras FOR UPDATE
USING (auth.uid() = pintor_id);

CREATE POLICY "Pintores podem deletar suas obras"
ON public.obras FOR DELETE
USING (auth.uid() = pintor_id);


-- 3. CRIAÇÃO DO BUCKET DE STORAGE PARA AS FOTOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-obras', 'portfolio-obras', true)
ON CONFLICT (id) DO NOTHING;

-- 4. REGRAS DE SEGURANÇA (RLS) DO STORAGE

-- Qualquer pessoa pode baixar/visualizar as fotos das obras
CREATE POLICY "Fotos do portfolio publicas"
ON storage.objects FOR SELECT
USING ( bucket_id = 'portfolio-obras' );

-- Apenas usuários autenticados (pintores logados) podem subir, editar ou apagar fotos
CREATE POLICY "Pintores logados podem subir fotos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'portfolio-obras' AND auth.role() = 'authenticated' );

CREATE POLICY "Pintores logados podem atualizar fotos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'portfolio-obras' AND auth.role() = 'authenticated' );

CREATE POLICY "Pintores logados podem deletar fotos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'portfolio-obras' AND auth.role() = 'authenticated' );
