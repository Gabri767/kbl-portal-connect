-- Criar tabela empresas se não existir
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  apelido_continuo TEXT,
  cnpj VARCHAR(20) UNIQUE,
  nire VARCHAR(20),
  insc_municipal VARCHAR(30),
  dt_ins_municipal DATE,
  endereco TEXT,
  numero VARCHAR(10),
  complemento TEXT,
  cep VARCHAR(10),
  bairro TEXT,
  cidade TEXT,
  uf CHAR(2),
  fone VARCHAR(20),
  regime TEXT,
  data_abertura DATE,
  cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  cliente_desde DATE,
  cliente_ate DATE,
  ativa BOOLEAN DEFAULT true,
  honorarios NUMERIC(10,2),
  website_empresa TEXT
);

-- Criar tabela pivot usuarios_empresas
CREATE TABLE IF NOT EXISTS usuarios_empresas (
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, empresa_id)
);

-- Habilitar RLS nas tabelas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_empresas ENABLE ROW LEVEL SECURITY;

-- Atualizar tabela usuarios com campos de convite
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'convite_pendente',
  ADD COLUMN IF NOT EXISTS convite_token UUID,
  ADD COLUMN IF NOT EXISTS convite_expires_at TIMESTAMP WITH TIME ZONE;

-- Adicionar constraint de status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_status_check'
  ) THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_status_check 
    CHECK (status IN ('ativo','inativo','convite_pendente'));
  END IF;
END $$;

-- Remover políticas existentes e recriar
DROP POLICY IF EXISTS "empresas_rls_policy" ON empresas;
DROP POLICY IF EXISTS "usuarios_empresas_rls_policy" ON usuarios_empresas;

-- Política para empresas: admin vê tudo, outros veem apenas suas empresas vinculadas
CREATE POLICY "empresas_rls_policy" ON empresas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
  OR id IN (
    SELECT ue.empresa_id 
    FROM usuarios_empresas ue
    WHERE ue.usuario_id = auth.uid()
  )
);

-- Política para usuarios_empresas
CREATE POLICY "usuarios_empresas_rls_policy" ON usuarios_empresas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
  OR usuario_id = auth.uid()
);