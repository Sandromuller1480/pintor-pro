-- ============================================================
-- AVALIACOES DE CLIENTES E FAVORITOS NO PERFIL DO PINTOR
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.painter_reviews
ADD COLUMN IF NOT EXISTS client_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_painter_reviews_application_client
  ON public.painter_reviews(application_id, client_auth_user_id);

DROP POLICY IF EXISTS "Clients can insert own reviews for accepted painters" ON public.painter_reviews;
CREATE POLICY "Clients can insert own reviews for accepted painters"
ON public.painter_reviews FOR INSERT
TO authenticated
WITH CHECK (
  client_auth_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.clientes AS c
    WHERE c.auth_user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_reviews.application_id
      AND a.status = 'accepted'
      AND a.auth_user_id IS DISTINCT FROM auth.uid()
  )
);

DROP POLICY IF EXISTS "Clients can update own reviews" ON public.painter_reviews;
CREATE POLICY "Clients can update own reviews"
ON public.painter_reviews FOR UPDATE
TO authenticated
USING (
  client_auth_user_id = auth.uid()
)
WITH CHECK (
  client_auth_user_id = auth.uid()
);

GRANT INSERT, UPDATE ON public.painter_reviews TO authenticated;

CREATE TABLE IF NOT EXISTS public.client_favorite_painters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_favorite_painters_unique
  ON public.client_favorite_painters(client_auth_user_id, application_id);

CREATE INDEX IF NOT EXISTS idx_client_favorite_painters_application_id
  ON public.client_favorite_painters(application_id);

ALTER TABLE public.client_favorite_painters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can read own favorite painters" ON public.client_favorite_painters;
CREATE POLICY "Clients can read own favorite painters"
ON public.client_favorite_painters FOR SELECT
TO authenticated
USING (
  client_auth_user_id = auth.uid()
);

DROP POLICY IF EXISTS "Clients can insert own favorite painters" ON public.client_favorite_painters;
CREATE POLICY "Clients can insert own favorite painters"
ON public.client_favorite_painters FOR INSERT
TO authenticated
WITH CHECK (
  client_auth_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.clientes AS c
    WHERE c.auth_user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = client_favorite_painters.application_id
      AND a.status = 'accepted'
      AND a.auth_user_id IS DISTINCT FROM auth.uid()
  )
);

DROP POLICY IF EXISTS "Clients can delete own favorite painters" ON public.client_favorite_painters;
CREATE POLICY "Clients can delete own favorite painters"
ON public.client_favorite_painters FOR DELETE
TO authenticated
USING (
  client_auth_user_id = auth.uid()
);

GRANT SELECT, INSERT, DELETE ON public.client_favorite_painters TO authenticated;
