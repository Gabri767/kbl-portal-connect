-- Criar tabela de regimes
CREATE TABLE IF NOT EXISTS public.regimes (
  id SERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir regimes comuns
INSERT INTO public.regimes (nome) VALUES 
  ('Simples Nacional'),
  ('Lucro Presumido'),
  ('Lucro Real'),
  ('MEI')
ON CONFLICT (nome) DO NOTHING;

-- Criar tabela de grupos de empresas
CREATE TABLE IF NOT EXISTS public.grupo_de_empresas (
  id SERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de tags
CREATE TABLE IF NOT EXISTS public.tags (
  id SERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Atualizar tabela de usuários com departamentos
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS comercial BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS compliance_fiscal BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS compliance_tributario BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS conciliacao_contabil BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS contabil BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS controladoria BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS financeiro BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fiscal BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gente_e_gestao BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pessoal BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS folha_de_pagamento_kit_mensal BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS societario BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sucesso_do_cliente BOOLEAN DEFAULT false;

-- Recriar tabela empresas com todos os campos necessários
DROP TABLE IF EXISTS public.empresas CASCADE;

CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT UNIQUE,
  fone TEXT,
  regime TEXT,
  nire TEXT,
  insc_municipal TEXT,
  dt_insc_municipal DATE,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  cep TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_de_abertura DATE,
  cliente_desde DATE,
  cliente_ate DATE,
  ativa TEXT DEFAULT 'Ativa',
  honorarios TEXT,
  website_da_empresa TEXT,
  apelido_continuo TEXT,
  grupo_de_empresas TEXT,
  inscricoes_estaduais TEXT,
  empresa_isenta TEXT DEFAULT 'Não',
  outros_identificadores TEXT,
  comentarios_e_anotacoes_gerais TEXT,
  tags TEXT,
  comercial UUID REFERENCES public.usuarios(id),
  compliance_fiscal UUID REFERENCES public.usuarios(id),
  compliance_tributario UUID REFERENCES public.usuarios(id),
  conciliacao_contabil UUID REFERENCES public.usuarios(id),
  contabil UUID REFERENCES public.usuarios(id),
  controladoria UUID REFERENCES public.usuarios(id),
  financeiro UUID REFERENCES public.usuarios(id),
  fiscal UUID REFERENCES public.usuarios(id),
  gente_e_gestao UUID REFERENCES public.usuarios(id),
  pessoal UUID REFERENCES public.usuarios(id),
  folha_de_pagamento_kit_mensal UUID REFERENCES public.usuarios(id),
  societario UUID REFERENCES public.usuarios(id),
  sucesso_do_cliente UUID REFERENCES public.usuarios(id)
);

-- Habilitar RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupo_de_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Política RLS para empresas
CREATE POLICY empresas_rls_policy ON public.empresas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    )
    OR EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
    )
  );