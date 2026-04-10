-- =========================================================================
-- SCRIPT DE CRIACAO DA TABELA "orcamentos"
-- Execute isso no SQL Editor do seu Supabase.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.orcamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pintor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 1. Dados do Cliente
    cliente_nome TEXT NOT NULL,
    cliente_cpf_cnpj TEXT,
    cliente_telefone TEXT NOT NULL,
    cliente_email TEXT,
    cliente_tipo TEXT,

    -- 2. Dados do Imovel
    imovel_endereco TEXT,
    imovel_cidade_estado TEXT,
    imovel_tipo TEXT,
    imovel_situacao TEXT,
    imovel_status TEXT,

    -- 3. Detalhamento das Areas
    ambientes JSONB DEFAULT '[]'::jsonb,

    -- 4. Tipo de Pintura
    pintura_tipo_servico TEXT,
    pintura_acabamento TEXT,
    pintura_acabamentos JSONB DEFAULT '[]'::jsonb,
    pintura_tinta TEXT,
    pintura_tintas JSONB DEFAULT '[]'::jsonb,

    -- 5. Preparacao da Superficie
    prep_situacao_parede TEXT,
    prep_servicos_necessarios JSONB DEFAULT '[]'::jsonb,

    -- 6. Complexidade do Servico
    comp_altura_trabalho TEXT,
    comp_necessidade JSONB DEFAULT '[]'::jsonb,
    comp_acesso TEXT,

    -- 7. Servicos Extras
    servicos_extras JSONB DEFAULT '[]'::jsonb,

    -- 8. Cores e Personalizacao
    cores_ja_definidas TEXT,
    cores_quantidade TEXT,
    cores_consultoria TEXT,

    -- 9. Prazo e Urgencia
    prazo_data_inicio DATE,
    prazo_estimado TEXT,
    prazo_urgencia TEXT,

    -- 10. Fornecimento
    fornecimento_materiais TEXT,

    -- 11. Valores do Orcamento
    valor_materiais NUMERIC(12,2),
    valor_deslocamento NUMERIC(12,2),
    valor_ajuste_extra NUMERIC(12,2),
    valor_desconto NUMERIC(12,2),
    valor_total NUMERIC(12,2),

    -- 12. Imagens
    imagens_paths JSONB DEFAULT '[]'::jsonb,

    -- 13. Observacoes
    observacoes TEXT,

    -- 14. Status da negociacao
    status TEXT DEFAULT 'novo',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- REGRAS DE SEGURANCA (RLS)
-- ==========================================
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir criacao publica de orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Pintor pode inserir seus orcamentos" ON public.orcamentos;
CREATE POLICY "Pintor pode inserir seus orcamentos"
ON public.orcamentos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = pintor_id);

DROP POLICY IF EXISTS "Pintor pode ver seus orcamentos" ON public.orcamentos;
CREATE POLICY "Pintor pode ver seus orcamentos"
ON public.orcamentos FOR SELECT
TO authenticated
USING (auth.uid() = pintor_id);

DROP POLICY IF EXISTS "Pintor pode atualizar seus orcamentos" ON public.orcamentos;
CREATE POLICY "Pintor pode atualizar seus orcamentos"
ON public.orcamentos FOR UPDATE
TO authenticated
USING (auth.uid() = pintor_id)
WITH CHECK (auth.uid() = pintor_id);

DROP POLICY IF EXISTS "Pintor pode deletar seus orcamentos" ON public.orcamentos;
CREATE POLICY "Pintor pode deletar seus orcamentos"
ON public.orcamentos FOR DELETE
TO authenticated
USING (auth.uid() = pintor_id);

-- ==========================================
-- BUCKET DE ANEXOS DOS ORCAMENTOS
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos-media', 'orcamentos-media', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Authenticated users can upload own quote media" ON storage.objects;
CREATE POLICY "Authenticated users can upload own quote media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'orcamentos-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can read own quote media" ON storage.objects;
CREATE POLICY "Authenticated users can read own quote media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'orcamentos-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can update own quote media" ON storage.objects;
CREATE POLICY "Authenticated users can update own quote media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'orcamentos-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'orcamentos-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can delete own quote media" ON storage.objects;
CREATE POLICY "Authenticated users can delete own quote media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'orcamentos-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
