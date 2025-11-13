-- Habilitar RLS na tabela auditoria
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- Política para auditoria - apenas admin pode ver e modificar
CREATE POLICY auditoria_rls_policy ON public.auditoria
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    )
  );