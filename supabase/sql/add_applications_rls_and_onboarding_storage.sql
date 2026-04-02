-- ============================================================
-- RLS DA TABELA APPLICATIONS E BUCKETS DO CREDENCIAMENTO
-- Execute este script antes de reativar a RLS em producao.
--
-- Observacao:
-- O fluxo atual de credenciamento do pintor ainda faz upload publico
-- de anexos enquanto a aplicacao esta em status "pending".
-- Isso mantem o fluxo funcionando com RLS ativa, mas o desenho ideal
-- no futuro e migrar esse onboarding para uma Edge Function.
-- ============================================================

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create pending painter applications" ON public.applications;
CREATE POLICY "Public can create pending painter applications"
ON public.applications FOR INSERT
TO anon, authenticated
WITH CHECK (
  COALESCE(status, 'pending') = 'pending'
);

DROP POLICY IF EXISTS "Painters can read own applications" ON public.applications;
CREATE POLICY "Painters can read own applications"
ON public.applications FOR SELECT
TO authenticated
USING (
  auth_user_id = auth.uid()
  OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

DROP POLICY IF EXISTS "Painters can update own applications" ON public.applications;
CREATE POLICY "Painters can update own applications"
ON public.applications FOR UPDATE
TO authenticated
USING (
  auth_user_id = auth.uid()
  OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  auth_user_id = auth.uid()
  OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

DROP POLICY IF EXISTS "Public can update pending painter applications" ON public.applications;
CREATE POLICY "Public can update pending painter applications"
ON public.applications FOR UPDATE
TO anon
USING (
  COALESCE(status, 'pending') = 'pending'
)
WITH CHECK (
  COALESCE(status, 'pending') = 'pending'
);

GRANT INSERT, SELECT, UPDATE ON public.applications TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('application-work-photos', 'application-work-photos', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public)
VALUES ('application-certifications', 'application-certifications', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Public can upload pending application work media" ON storage.objects;
CREATE POLICY "Public can upload pending application work media"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'application-work-photos'
  AND (storage.foldername(name))[2] IN ('profile-photo', 'work-photos')
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND (
        a.status = 'pending'
        OR a.auth_user_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "Painters can read own application work media" ON storage.objects;
CREATE POLICY "Painters can read own application work media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-work-photos'
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Public can upload pending application certifications" ON storage.objects;
CREATE POLICY "Public can upload pending application certifications"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'application-certifications'
  AND (storage.foldername(name))[2] = 'certifications'
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND (
        a.status = 'pending'
        OR a.auth_user_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "Painters can read own application certifications" ON storage.objects;
CREATE POLICY "Painters can read own application certifications"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-certifications'
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.auth_user_id = auth.uid()
  )
);
