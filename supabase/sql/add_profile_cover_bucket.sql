-- =========================================================================
-- BUCKET E PREFIXOS PARA FOTO DE PERFIL E FOTO DE CAPA
-- Execute este script no SQL Editor do Supabase.
--
-- Observacao:
-- No Supabase Storage, "pastas" sao virtuais.
-- Elas passam a existir quando voce envia arquivos com estes caminhos:
--   foto-perfil/<auth.uid>/<arquivo>
--   foto-capa/<auth.uid>/<arquivo>
-- =========================================================================

-- 1. Criar bucket para midias do pintor
INSERT INTO storage.buckets (id, name, public)
VALUES ('painters-media', 'painters-media', true)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

-- 2. Politicas de leitura publica
DROP POLICY IF EXISTS "Public can view painter media" ON storage.objects;
CREATE POLICY "Public can view painter media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'painters-media');

-- 3. Politica de upload para foto de perfil e foto de capa
DROP POLICY IF EXISTS "Authenticated users can upload own painter media" ON storage.objects;
CREATE POLICY "Authenticated users can upload own painter media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'painters-media'
  AND (storage.foldername(name))[1] IN ('foto-perfil', 'foto-capa')
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. Politica de atualizacao
DROP POLICY IF EXISTS "Authenticated users can update own painter media" ON storage.objects;
CREATE POLICY "Authenticated users can update own painter media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'painters-media'
  AND (storage.foldername(name))[1] IN ('foto-perfil', 'foto-capa')
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'painters-media'
  AND (storage.foldername(name))[1] IN ('foto-perfil', 'foto-capa')
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 5. Politica de exclusao
DROP POLICY IF EXISTS "Authenticated users can delete own painter media" ON storage.objects;
CREATE POLICY "Authenticated users can delete own painter media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'painters-media'
  AND (storage.foldername(name))[1] IN ('foto-perfil', 'foto-capa')
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 6. Exemplos de caminhos validos neste bucket:
-- foto-perfil/00000000-0000-0000-0000-000000000000/avatar.jpg
-- foto-capa/00000000-0000-0000-0000-000000000000/capa.jpg
