CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.painter_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
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
