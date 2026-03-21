-- =========================================================================
-- SCRIPT DE CRIAÇÃO DA TABELA "orcamentos"
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
    
    -- 2. Dados do Imóvel
    imovel_endereco TEXT,
    imovel_cidade_estado TEXT,
    imovel_tipo TEXT,
    imovel_situacao TEXT,
    imovel_status TEXT,
    
    -- 3. Detalhamento das Áreas (Vão ser salvos como JSON: [{nome: 'Sala', area: '20'}...])
    ambientes JSONB DEFAULT '[]'::jsonb,
    
    -- 4. Tipo de Pintura
    pintura_tipo_servico TEXT,
    pintura_acabamento TEXT,
    pintura_tinta TEXT,
    
    -- 5. Preparação da Superfície
    prep_situacao_parede TEXT,
    prep_servicos_necessarios JSONB DEFAULT '[]'::jsonb,
    
    -- 6. Complexidade do Serviço
    comp_altura_trabalho TEXT,
    comp_necessidade JSONB DEFAULT '[]'::jsonb,
    comp_acesso TEXT,
    
    -- 7. Serviços Extras
    servicos_extras JSONB DEFAULT '[]'::jsonb,
    
    -- 8. Cores e Personalização
    cores_ja_definidas TEXT,
    cores_quantidade TEXT,
    cores_consultoria TEXT,
    
    -- 9. Prazo e Urgência
    prazo_data_inicio DATE,
    prazo_estimado TEXT,
    prazo_urgencia TEXT,
    
    -- 10. Fornecimento
    fornecimento_materiais TEXT,
    
    -- 11. Imagens
    imagens_paths JSONB DEFAULT '[]'::jsonb,
    
    -- 12. Observações
    observacoes TEXT,
    
    -- 13. Status da Negociação (Controle interno do Painel)
    status TEXT DEFAULT 'novo', -- Pode ser: novo, respondido, em_negociacao, fechado, recusado
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- REGRAS DE SEGURANÇA (RLS - ROW LEVEL SECURITY)
-- ==========================================
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- 1. Permitir que clientes (visitantes do site) enviem novos orçamentos
CREATE POLICY "Permitir criacao publica de orcamentos" 
ON public.orcamentos FOR INSERT 
WITH CHECK (true);

-- 2. Permitir que o Pintor veja SOMENTE os orçamentos que foram enviados para ELE
CREATE POLICY "Pintor pode ver seus orcamentos" 
ON public.orcamentos FOR SELECT 
USING (auth.uid() = pintor_id);

-- 3. Permitir que o Pintor edite apenas os seus orçamentos (ex: mudar status)
CREATE POLICY "Pintor pode atualizar seus orcamentos" 
ON public.orcamentos FOR UPDATE 
USING (auth.uid() = pintor_id);
