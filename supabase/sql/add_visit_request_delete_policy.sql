-- ============================================================
-- DELETE REAL DE AGENDAMENTOS PELO PINTOR
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

DROP POLICY IF EXISTS "Painters can delete own visit requests" ON public.painter_visit_requests;
CREATE POLICY "Painters can delete own visit requests"
ON public.painter_visit_requests FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications AS a
    WHERE a.id = painter_visit_requests.application_id
      AND a.auth_user_id = auth.uid()
  )
);

GRANT DELETE ON public.painter_visit_requests TO authenticated;
