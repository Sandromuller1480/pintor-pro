-- ============================================================
-- BUCKET PARA ANEXOS DE ORCAMENTOS
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

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
