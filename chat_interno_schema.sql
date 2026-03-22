CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.painter_chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  unread_for_painter BOOLEAN NOT NULL DEFAULT true,
  last_message_preview TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.painter_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES public.painter_chat_threads(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'painter')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_painter_chat_threads_application_id
  ON public.painter_chat_threads(application_id);

CREATE INDEX IF NOT EXISTS idx_painter_chat_threads_last_message_at
  ON public.painter_chat_threads(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_painter_chat_messages_thread_id
  ON public.painter_chat_messages(thread_id);

ALTER TABLE public.painter_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painter_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.start_painter_chat(
  p_application_id UUID,
  p_client_name TEXT,
  p_client_phone TEXT,
  p_client_email TEXT,
  p_initial_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread_id UUID := uuid_generate_v4();
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = p_application_id
      AND a.status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Pintor indisponivel para chat.'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.painter_chat_threads (
    id,
    application_id,
    client_name,
    client_phone,
    client_email,
    status,
    unread_for_painter,
    last_message_preview,
    last_message_at
  )
  VALUES (
    v_thread_id,
    p_application_id,
    TRIM(p_client_name),
    TRIM(p_client_phone),
    LOWER(TRIM(p_client_email)),
    'open',
    true,
    LEFT(TRIM(p_initial_message), 180),
    timezone('utc'::text, now())
  );

  INSERT INTO public.painter_chat_messages (
    thread_id,
    sender_type,
    sender_name,
    message
  )
  VALUES (
    v_thread_id,
    'client',
    TRIM(p_client_name),
    TRIM(p_initial_message)
  );

  RETURN v_thread_id;
END;
$$;

DROP POLICY IF EXISTS "Public can create chat threads for accepted painters" ON public.painter_chat_threads;
CREATE POLICY "Public can create chat threads for accepted painters"
ON public.painter_chat_threads FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_chat_threads.application_id
      AND a.status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Painters can read own chat threads" ON public.painter_chat_threads;
CREATE POLICY "Painters can read own chat threads"
ON public.painter_chat_threads FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_chat_threads.application_id
      AND a.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Painters can update own chat threads" ON public.painter_chat_threads;
CREATE POLICY "Painters can update own chat threads"
ON public.painter_chat_threads FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_chat_threads.application_id
      AND a.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_chat_threads.application_id
      AND a.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Public can create messages for accepted painters" ON public.painter_chat_messages;
CREATE POLICY "Public can create messages for accepted painters"
ON public.painter_chat_messages FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.painter_chat_threads AS t
    JOIN public.applications AS a ON a.id = t.application_id
    WHERE t.id = painter_chat_messages.thread_id
      AND a.status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Painters can read own chat messages" ON public.painter_chat_messages;
CREATE POLICY "Painters can read own chat messages"
ON public.painter_chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.painter_chat_threads AS t
    JOIN public.applications AS a ON a.id = t.application_id
    WHERE t.id = painter_chat_messages.thread_id
      AND a.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Painters can insert own chat messages" ON public.painter_chat_messages;
CREATE POLICY "Painters can insert own chat messages"
ON public.painter_chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.painter_chat_threads AS t
    JOIN public.applications AS a ON a.id = t.application_id
    WHERE t.id = painter_chat_messages.thread_id
      AND a.auth_user_id = auth.uid()
  )
);

GRANT INSERT ON public.painter_chat_threads TO anon, authenticated;
GRANT SELECT, UPDATE ON public.painter_chat_threads TO authenticated;
GRANT INSERT ON public.painter_chat_messages TO anon, authenticated;
GRANT SELECT, INSERT ON public.painter_chat_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_painter_chat(UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
