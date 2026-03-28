CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.painter_visit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_painter_visit_requests_application_id
  ON public.painter_visit_requests(application_id);

CREATE INDEX IF NOT EXISTS idx_painter_visit_requests_schedule
  ON public.painter_visit_requests(preferred_date, preferred_time);

ALTER TABLE public.painter_visit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create visit requests for accepted painters" ON public.painter_visit_requests;
CREATE POLICY "Public can create visit requests for accepted painters"
ON public.painter_visit_requests FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_visit_requests.application_id
      AND a.status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Painters can read own visit requests" ON public.painter_visit_requests;
CREATE POLICY "Painters can read own visit requests"
ON public.painter_visit_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_visit_requests.application_id
      AND a.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Painters can update own visit requests" ON public.painter_visit_requests;
CREATE POLICY "Painters can update own visit requests"
ON public.painter_visit_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_visit_requests.application_id
      AND a.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_visit_requests.application_id
      AND a.auth_user_id = auth.uid()
  )
);

GRANT INSERT ON public.painter_visit_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.painter_visit_requests TO authenticated;
