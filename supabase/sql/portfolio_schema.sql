-- =========================================================================
-- SCHEMA DA TABELA "obras" E DO BUCKET DE PORTFOLIO
-- Execute isso no SQL Editor do seu Supabase.
-- Inclui foto, video e midias por etapa da pintura.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.obras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pintor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    titulo TEXT NOT NULL,
    local TEXT NOT NULL,
    tipo_imovel TEXT NOT NULL,
    tipo_pintura TEXT NOT NULL,
    status TEXT DEFAULT 'CONCLUIDO', -- Pode ser 'CONCLUIDO' ou 'EM ANDAMENTO'
    imagem_url TEXT, -- Caminho da imagem no storage
    video_url TEXT, -- Caminho do video no storage
    stage_media JSONB NOT NULL DEFAULT jsonb_build_object(
      'preparo_reboco_fundo', jsonb_build_object('images', '[]'::jsonb, 'videos', '[]'::jsonb),
      'massa_corrida_lixamento', jsonb_build_object('images', '[]'::jsonb, 'videos', '[]'::jsonb),
      'pintura_acabamento', jsonb_build_object('images', '[]'::jsonb, 'videos', '[]'::jsonb)
    ),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Regras de seguranca (RLS) da tabela
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

-- Visitantes podem ver as obras para o perfil publico do pintor ficar visivel na vitrine
DROP POLICY IF EXISTS "Qualquer pessoa pode ver as obras" ON public.obras;
CREATE POLICY "Qualquer pessoa pode ver as obras"
ON public.obras FOR SELECT
USING (true);

-- O pintor logado pode criar, editar e deletar apenas as suas proprias obras
DROP POLICY IF EXISTS "Pintores podem inserir suas obras" ON public.obras;
CREATE POLICY "Pintores podem inserir suas obras"
ON public.obras FOR INSERT
WITH CHECK (auth.uid() = pintor_id);

DROP POLICY IF EXISTS "Pintores podem atualizar suas obras" ON public.obras;
CREATE POLICY "Pintores podem atualizar suas obras"
ON public.obras FOR UPDATE
USING (auth.uid() = pintor_id);

DROP POLICY IF EXISTS "Pintores podem deletar suas obras" ON public.obras;
CREATE POLICY "Pintores podem deletar suas obras"
ON public.obras FOR DELETE
USING (auth.uid() = pintor_id);

-- Criacao do bucket de storage para as midias
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-obras', 'portfolio-obras', true)
ON CONFLICT (id) DO NOTHING;

-- Regras de seguranca (RLS) do storage

-- Qualquer pessoa pode baixar e visualizar as midias das obras
DROP POLICY IF EXISTS "Fotos do portfolio publicas" ON storage.objects;
CREATE POLICY "Fotos do portfolio publicas"
ON storage.objects FOR SELECT
USING ( bucket_id = 'portfolio-obras' );

-- Apenas usuarios autenticados podem subir, editar ou apagar midias
DROP POLICY IF EXISTS "Pintores logados podem subir fotos" ON storage.objects;
CREATE POLICY "Pintores logados podem subir fotos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'portfolio-obras' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Pintores logados podem atualizar fotos" ON storage.objects;
CREATE POLICY "Pintores logados podem atualizar fotos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'portfolio-obras' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Pintores logados podem deletar fotos" ON storage.objects;
CREATE POLICY "Pintores logados podem deletar fotos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'portfolio-obras' AND auth.role() = 'authenticated' );
