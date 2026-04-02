-- ============================================================
-- DASHBOARD ADMIN DA PLATAFORMA
-- Execute este script no SQL Editor do Supabase.
-- Cria a tabela admin_users e libera o acesso minimo
-- para o painel administrativo com RLS ativa.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'owner',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_users_auth_user_id
  ON public.admin_users(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_users_email
  ON public.admin_users(email);

CREATE OR REPLACE FUNCTION public.set_admin_users_updated_at()
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
    WHERE tgname = 'set_admin_users_updated_at_trigger'
  ) THEN
    CREATE TRIGGER set_admin_users_updated_at_trigger
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_admin_users_updated_at();
  END IF;
END
$$;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read own admin profile" ON public.admin_users;
CREATE POLICY "Authenticated users can read own admin profile"
ON public.admin_users FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    auth_user_id = auth.uid()
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

GRANT SELECT ON public.admin_users TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE is_active = true
      AND (
        auth_user_id = auth.uid()
        OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'applications'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read all applications" ON public.applications';
    EXECUTE 'CREATE POLICY "Admins can read all applications" ON public.applications FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update all applications" ON public.applications';
    EXECUTE 'CREATE POLICY "Admins can update all applications" ON public.applications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    EXECUTE 'GRANT SELECT, UPDATE ON public.applications TO authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clientes'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read all clientes" ON public.clientes';
    EXECUTE 'CREATE POLICY "Admins can read all clientes" ON public.clientes FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'GRANT SELECT ON public.clientes TO authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'obras'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read all obras" ON public.obras';
    EXECUTE 'CREATE POLICY "Admins can read all obras" ON public.obras FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'GRANT SELECT ON public.obras TO authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orcamentos'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read all orcamentos" ON public.orcamentos';
    EXECUTE 'CREATE POLICY "Admins can read all orcamentos" ON public.orcamentos FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'GRANT SELECT ON public.orcamentos TO authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'painter_chat_threads'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read all chat threads" ON public.painter_chat_threads';
    EXECUTE 'CREATE POLICY "Admins can read all chat threads" ON public.painter_chat_threads FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'GRANT SELECT ON public.painter_chat_threads TO authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'painter_visit_requests'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read all visit requests" ON public.painter_visit_requests';
    EXECUTE 'CREATE POLICY "Admins can read all visit requests" ON public.painter_visit_requests FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'GRANT SELECT ON public.painter_visit_requests TO authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'painter_profile_views'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read all profile views" ON public.painter_profile_views';
    EXECUTE 'CREATE POLICY "Admins can read all profile views" ON public.painter_profile_views FOR SELECT TO authenticated USING (public.is_admin())';
    EXECUTE 'GRANT SELECT ON public.painter_profile_views TO authenticated';
  END IF;
END
$$;

-- Cadastro inicial do dono da plataforma.
-- A senha NAO entra neste SQL. Ela continua sendo gerida no Supabase Auth.
INSERT INTO public.admin_users (full_name, email, role, is_active)
VALUES ('Sandro Muller', 'sandromullerdesenhoarte@gmail.com', 'owner', true)
ON CONFLICT (email) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;
