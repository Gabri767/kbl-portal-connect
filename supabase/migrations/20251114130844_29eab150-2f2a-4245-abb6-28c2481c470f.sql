-- Habilitar extensões UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Garantir default de id como gen_random_uuid()
ALTER TABLE empresas ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Tornar campos NULLABLE, exceto razao_social, cnpj e ativa
ALTER TABLE empresas
  ALTER COLUMN nome_fantasia DROP NOT NULL,
  ALTER COLUMN fone DROP NOT NULL,
  ALTER COLUMN nire DROP NOT NULL,
  ALTER COLUMN insc_municipal DROP NOT NULL,
  ALTER COLUMN dt_insc_municipal DROP NOT NULL,
  ALTER COLUMN endereco DROP NOT NULL,
  ALTER COLUMN numero DROP NOT NULL,
  ALTER COLUMN complemento DROP NOT NULL,
  ALTER COLUMN cep DROP NOT NULL,
  ALTER COLUMN bairro DROP NOT NULL,
  ALTER COLUMN cidade DROP NOT NULL,
  ALTER COLUMN uf DROP NOT NULL,
  ALTER COLUMN data_de_abertura DROP NOT NULL,
  ALTER COLUMN cliente_desde DROP NOT NULL,
  ALTER COLUMN cliente_ate DROP NOT NULL,
  ALTER COLUMN honorarios DROP NOT NULL,
  ALTER COLUMN website_da_empresa DROP NOT NULL,
  ALTER COLUMN apelido_continuo DROP NOT NULL,
  ALTER COLUMN inscricoes_estaduais DROP NOT NULL,
  ALTER COLUMN outros_identificadores DROP NOT NULL,
  ALTER COLUMN comentarios_e_anotacoes_gerais DROP NOT NULL,
  ALTER COLUMN tags DROP NOT NULL,
  ALTER COLUMN grupo_de_empresas DROP NOT NULL,
  ALTER COLUMN regime DROP NOT NULL,
  ALTER COLUMN empresa_isenta DROP NOT NULL,
  ALTER COLUMN comercial DROP NOT NULL,
  ALTER COLUMN compliance_fiscal DROP NOT NULL,
  ALTER COLUMN compliance_tributario DROP NOT NULL,
  ALTER COLUMN conciliacao_contabil DROP NOT NULL,
  ALTER COLUMN contabil DROP NOT NULL,
  ALTER COLUMN controladoria DROP NOT NULL,
  ALTER COLUMN financeiro DROP NOT NULL,
  ALTER COLUMN fiscal DROP NOT NULL,
  ALTER COLUMN gente_e_gestao DROP NOT NULL,
  ALTER COLUMN pessoal DROP NOT NULL,
  ALTER COLUMN folha_de_pagamento_kit_mensal DROP NOT NULL,
  ALTER COLUMN societario DROP NOT NULL,
  ALTER COLUMN sucesso_do_cliente DROP NOT NULL;

-- Assegurar NOT NULL somente para campos obrigatórios
ALTER TABLE empresas
  ALTER COLUMN razao_social SET NOT NULL,
  ALTER COLUMN cnpj SET NOT NULL,
  ALTER COLUMN ativa SET NOT NULL;

-- Criar unique constraint em cnpj
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_empresas_cnpj'
  ) THEN
    ALTER TABLE empresas ADD CONSTRAINT uq_empresas_cnpj UNIQUE (cnpj);
  END IF;
END$$;

-- Criar função para converter ID não-UUID em UUID determinístico
CREATE OR REPLACE FUNCTION public.convert_to_uuid(input_text text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  namespace_uuid uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Se já for UUID válido, retorna
  IF input_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN input_text::uuid;
  END IF;
  
  -- Caso contrário, gera UUID determinístico usando v5
  RETURN uuid_generate_v5(namespace_uuid, input_text);
END;
$$;