CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  celular TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clientes_email
  ON public.clientes(email);

CREATE INDEX IF NOT EXISTS idx_clientes_auth_user_id
  ON public.clientes(auth_user_id);

CREATE OR REPLACE FUNCTION public.set_clientes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_clientes_updated_at_trigger'
  ) THEN
    CREATE TRIGGER set_clientes_updated_at_trigger
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_clientes_updated_at();
  END IF;
END
$$;

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert clientes" ON public.clientes;
CREATE POLICY "Public can insert clientes"
ON public.clientes FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read own cliente profile" ON public.clientes;
CREATE POLICY "Authenticated users can read own cliente profile"
ON public.clientes FOR SELECT
TO authenticated
USING (
  auth_user_id = auth.uid()
  OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

DROP POLICY IF EXISTS "Authenticated users can update own cliente profile" ON public.clientes;
CREATE POLICY "Authenticated users can update own cliente profile"
ON public.clientes FOR UPDATE
TO authenticated
USING (
  auth_user_id = auth.uid()
  OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  auth_user_id = auth.uid()
  OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

GRANT INSERT ON public.clientes TO anon, authenticated;
GRANT SELECT, UPDATE ON public.clientes TO authenticated;
