CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.painter_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  client_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_avatar_url TEXT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_painter_reviews_application_id
  ON public.painter_reviews(application_id);

CREATE INDEX IF NOT EXISTS idx_painter_reviews_created_at
  ON public.painter_reviews(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_painter_reviews_application_client
  ON public.painter_reviews(application_id, client_auth_user_id);

ALTER TABLE public.painter_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read reviews for accepted painters" ON public.painter_reviews;
CREATE POLICY "Public can read reviews for accepted painters"
ON public.painter_reviews FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_reviews.application_id
      AND a.status = 'accepted'
  )
);

GRANT SELECT ON public.painter_reviews TO anon, authenticated;
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
