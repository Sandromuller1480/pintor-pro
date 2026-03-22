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
