-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'colaborador', 'cliente');

-- Create empresas table
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj VARCHAR(20),
  dados_fiscais JSONB,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create usuarios table (for local authentication)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  departamentos TEXT[] DEFAULT ARRAY['Fiscal'],
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret TEXT,
  bloqueado_until TIMESTAMP,
  tentativas_login INTEGER DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table (separate for security - prevents privilege escalation)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create contas table with departamento field
CREATE TABLE IF NOT EXISTS public.contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  codigo VARCHAR(50),
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('ativo', 'passivo', 'receita', 'despesa', 'patrimonio')),
  departamento TEXT NOT NULL DEFAULT 'Fiscal',
  saldo NUMERIC(18,2) DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lancamentos table with departamento field
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  conta_id UUID REFERENCES public.contas(id) ON DELETE SET NULL,
  valor NUMERIC(18,2) NOT NULL,
  tipo TEXT CHECK (tipo IN ('credito', 'debito')) NOT NULL,
  departamento TEXT NOT NULL DEFAULT 'Fiscal',
  descricao TEXT,
  data DATE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  criado_por UUID REFERENCES public.usuarios(id)
);

-- Create auditoria table
CREATE TABLE IF NOT EXISTS public.auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.usuarios(id),
  acao TEXT NOT NULL,
  detalhe JSONB,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON public.usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_departamentos ON public.usuarios USING GIN(departamentos);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_empresa ON public.contas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_departamento ON public.contas(departamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_empresa ON public.lancamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_departamento ON public.lancamentos(departamento);

-- Enable RLS on data tables
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- RLS Policy for contas: Admin sees all, others see only their empresa + their departments
CREATE POLICY contas_rls_policy ON public.contas
  FOR ALL
  USING (
    -- Admin can access all
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
    OR
    -- Others can only access their empresa and matching departments
    (
      empresa_id IN (
        SELECT u.empresa_id FROM public.usuarios u WHERE u.id = auth.uid()
      )
      AND departamento = ANY (
        SELECT unnest(u.departamentos) FROM public.usuarios u WHERE u.id = auth.uid()
      )
    )
  );

-- RLS Policy for lancamentos: Same logic as contas
CREATE POLICY lancamentos_rls_policy ON public.lancamentos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
    OR
    (
      empresa_id IN (
        SELECT u.empresa_id FROM public.usuarios u WHERE u.id = auth.uid()
      )
      AND departamento = ANY (
        SELECT unnest(u.departamentos) FROM public.usuarios u WHERE u.id = auth.uid()
      )
    )
  );

-- RLS Policy for empresas: Users can only see their own empresa, admin sees all
CREATE POLICY empresas_rls_policy ON public.empresas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
    OR
    id IN (
      SELECT u.empresa_id FROM public.usuarios u WHERE u.id = auth.uid()
    )
  );

-- RLS Policy for user_roles: Users can only see their own roles
CREATE POLICY user_roles_select_policy ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Allow admin to insert/update/delete user_roles
CREATE POLICY user_roles_admin_all ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));