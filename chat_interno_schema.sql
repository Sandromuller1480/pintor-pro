CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.painter_chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

ALTER TABLE public.painter_chat_threads
  ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_painter_chat_threads_application_id
  ON public.painter_chat_threads(application_id);

CREATE INDEX IF NOT EXISTS idx_painter_chat_threads_client_user_id
  ON public.painter_chat_threads(client_user_id);

CREATE INDEX IF NOT EXISTS idx_painter_chat_threads_last_message_at
  ON public.painter_chat_threads(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_painter_chat_messages_thread_id
  ON public.painter_chat_messages(thread_id);

ALTER TABLE public.painter_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.painter_chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'painter_chat_threads'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.painter_chat_threads;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'painter_chat_messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.painter_chat_messages;
    END IF;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.sync_painter_chat_thread_from_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.painter_chat_threads
  SET
    last_message_preview = LEFT(NEW.message, 180),
    last_message_at = COALESCE(NEW.created_at, timezone('utc'::text, now())),
    unread_for_painter = (NEW.sender_type = 'client'),
    status = 'open'
  WHERE id = NEW.thread_id;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'sync_painter_chat_thread_from_message_trigger'
  ) THEN
    CREATE TRIGGER sync_painter_chat_thread_from_message_trigger
    AFTER INSERT ON public.painter_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_painter_chat_thread_from_message();
  END IF;
END
$$;

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
  v_client_user_id UUID := auth.uid();
BEGIN
  IF v_client_user_id IS NULL THEN
    RAISE EXCEPTION 'Cliente precisa iniciar uma sessao para usar o chat.'
      USING ERRCODE = 'P0001';
  END IF;

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
    client_user_id,
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
    v_client_user_id,
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
DROP POLICY IF EXISTS "Clients can create chat threads for accepted painters" ON public.painter_chat_threads;
CREATE POLICY "Clients can create chat threads for accepted painters"
ON public.painter_chat_threads FOR INSERT
TO authenticated
WITH CHECK (
  client_user_id = auth.uid()
  AND
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_chat_threads.application_id
      AND a.status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Clients can read own chat threads" ON public.painter_chat_threads;
CREATE POLICY "Clients can read own chat threads"
ON public.painter_chat_threads FOR SELECT
TO authenticated
USING (client_user_id = auth.uid());

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
DROP POLICY IF EXISTS "Clients can insert own chat messages" ON public.painter_chat_messages;
CREATE POLICY "Clients can insert own chat messages"
ON public.painter_chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_type = 'client'
  AND EXISTS (
    SELECT 1
    FROM public.painter_chat_threads AS t
    JOIN public.applications AS a ON a.id = t.application_id
    WHERE t.id = painter_chat_messages.thread_id
      AND t.client_user_id = auth.uid()
      AND a.status = 'accepted'
  )
);

DROP POLICY IF EXISTS "Clients can read own chat messages" ON public.painter_chat_messages;
CREATE POLICY "Clients can read own chat messages"
ON public.painter_chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.painter_chat_threads AS t
    JOIN public.applications AS a ON a.id = t.application_id
    WHERE t.id = painter_chat_messages.thread_id
      AND t.client_user_id = auth.uid()
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
  sender_type = 'painter'
  AND
  EXISTS (
    SELECT 1
    FROM public.painter_chat_threads AS t
    JOIN public.applications AS a ON a.id = t.application_id
    WHERE t.id = painter_chat_messages.thread_id
      AND a.auth_user_id = auth.uid()
  )
);

GRANT INSERT ON public.painter_chat_threads TO authenticated;
GRANT SELECT, UPDATE ON public.painter_chat_threads TO authenticated;
GRANT INSERT ON public.painter_chat_messages TO authenticated;
GRANT SELECT, INSERT ON public.painter_chat_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_painter_chat(UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
