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
    is_publicly_visible BOOLEAN NOT NULL DEFAULT true,
    featured_in_showcase BOOLEAN NOT NULL DEFAULT false,
    admin_review_status TEXT NOT NULL DEFAULT 'approved',
    admin_review_notes TEXT,
    admin_reviewed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Regras de seguranca (RLS) da tabela
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

-- Visitantes podem ver as obras para o perfil publico do pintor ficar visivel na vitrine
DROP POLICY IF EXISTS "Qualquer pessoa pode ver as obras" ON public.obras;
CREATE POLICY "Qualquer pessoa pode ver as obras"
ON public.obras FOR SELECT
USING (
  COALESCE(is_publicly_visible, true) = true
  AND COALESCE(admin_review_status, 'approved') <> 'blocked'
);

DROP POLICY IF EXISTS "Pintores podem ver suas obras" ON public.obras;
CREATE POLICY "Pintores podem ver suas obras"
ON public.obras FOR SELECT
TO authenticated
USING (auth.uid() = pintor_id);

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
VALUES ('portfolio-obras', 'portfolio-obras', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- Regras de seguranca (RLS) do storage

-- Qualquer pessoa pode gerar signed URLs das midias apenas para obras publicas
DROP POLICY IF EXISTS "Fotos do portfolio publicas" ON storage.objects;
CREATE POLICY "Fotos do portfolio publicas"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'portfolio-obras'
  AND (storage.foldername(name))[1] = 'obras'
  AND EXISTS (
    SELECT 1
    FROM public.obras AS o
    WHERE o.id::text = (storage.foldername(name))[3]
      AND o.pintor_id::text = (storage.foldername(name))[2]
      AND COALESCE(o.is_publicly_visible, true) = true
      AND COALESCE(o.admin_review_status, 'approved') <> 'blocked'
  )
);

DROP POLICY IF EXISTS "Pintores logados podem ler suas fotos" ON storage.objects;
CREATE POLICY "Pintores logados podem ler suas fotos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'portfolio-obras'
  AND (storage.foldername(name))[1] = 'obras'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Apenas usuarios autenticados podem subir, editar ou apagar midias
DROP POLICY IF EXISTS "Pintores logados podem subir fotos" ON storage.objects;
CREATE POLICY "Pintores logados podem subir fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-obras'
  AND (storage.foldername(name))[1] = 'obras'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

DROP POLICY IF EXISTS "Pintores logados podem atualizar fotos" ON storage.objects;
CREATE POLICY "Pintores logados podem atualizar fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portfolio-obras'
  AND (storage.foldername(name))[1] = 'obras'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'portfolio-obras'
  AND (storage.foldername(name))[1] = 'obras'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

DROP POLICY IF EXISTS "Pintores logados podem deletar fotos" ON storage.objects;
CREATE POLICY "Pintores logados podem deletar fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio-obras'
  AND (storage.foldername(name))[1] = 'obras'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
