-- ============================================================
-- PORTFOLIO PRIVADO COM SIGNED URLS
-- Execute este script no SQL Editor do Supabase.
-- Migra o bucket do portfolio para privado e ajusta as
-- policies para leitura publica controlada por obra.
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-obras', 'portfolio-obras', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pintores podem ver suas obras" ON public.obras;
CREATE POLICY "Pintores podem ver suas obras"
ON public.obras FOR SELECT
TO authenticated
USING (auth.uid() = pintor_id);

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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'is_admin'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read all portfolio media" ON storage.objects';
    EXECUTE 'CREATE POLICY "Admins can read all portfolio media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = ''portfolio-obras'' AND public.is_admin())';
  END IF;
END
$$;
