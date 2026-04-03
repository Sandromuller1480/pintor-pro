-- ============================================================
-- AUDITORIA DAS ACOES DO DASHBOARD ADMIN
-- Execute este script em bases que ja possuem admin_dashboard_schema.sql.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  admin_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_label TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at
  ON public.admin_action_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_target
  ON public.admin_action_logs(target_table, target_id);

ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.admin_action_logs;
CREATE POLICY "Admins can read audit logs"
ON public.admin_action_logs FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_action_logs;
CREATE POLICY "Admins can insert audit logs"
ON public.admin_action_logs FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  AND (
    admin_auth_user_id = auth.uid()
    OR lower(admin_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

GRANT SELECT, INSERT ON public.admin_action_logs TO authenticated;
