-- Habilitar RLS nas tabelas que estavam faltando
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_empresas ENABLE ROW LEVEL SECURITY;

-- Política para usuarios - admin pode ver todos, usuários podem ver apenas a si mesmos
CREATE POLICY usuarios_rls_policy ON public.usuarios
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    )
    OR id = auth.uid()
  );

-- Política para usuarios_empresas - admin pode ver todos, usuários podem ver apenas suas empresas
CREATE POLICY usuarios_empresas_view_policy ON public.usuarios_empresas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    )
    OR usuario_id = auth.uid()
  );