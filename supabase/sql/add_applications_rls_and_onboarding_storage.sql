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

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS onboarding_token UUID;

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

GRANT INSERT, SELECT ON public.applications TO anon, authenticated;
GRANT UPDATE ON public.applications TO authenticated;

CREATE OR REPLACE FUNCTION public.finalize_painter_application_assets(
  p_application_id UUID,
  p_onboarding_token UUID,
  p_profile_photo_path TEXT,
  p_work_photo_paths TEXT[],
  p_certification_paths TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.applications
  SET
    profile_photo_path = p_profile_photo_path,
    work_photo_paths = COALESCE(p_work_photo_paths, ARRAY[]::text[]),
    certification_paths = COALESCE(p_certification_paths, ARRAY[]::text[]),
    work_photo_count = COALESCE(array_length(p_work_photo_paths, 1), 0),
    certification_count = COALESCE(array_length(p_certification_paths, 1), 0)
  WHERE id = p_application_id
    AND onboarding_token = p_onboarding_token
    AND (
      status = 'pending'
      OR auth_user_id = auth.uid()
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aplicacao de onboarding nao encontrada ou token invalido.'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_painter_application_assets(UUID, UUID, TEXT, TEXT[], TEXT[]) TO anon, authenticated;

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
  AND (storage.foldername(name))[3] IN ('profile-photo', 'work-photos')
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.onboarding_token::text = (storage.foldername(name))[2]
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
  AND (storage.foldername(name))[3] = 'certifications'
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.onboarding_token::text = (storage.foldername(name))[2]
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
