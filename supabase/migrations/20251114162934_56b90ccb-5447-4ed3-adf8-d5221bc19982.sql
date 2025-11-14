-- Remove tabela empresas e constraints relacionadas
DROP TABLE IF EXISTS empresas CASCADE;

-- Remove tabela usuarios_empresas se existir
DROP TABLE IF EXISTS usuarios_empresas CASCADE;

-- Opcional: limpar auditoria antiga de empresas (comentar se quiser manter histórico)
-- DELETE FROM auditoria WHERE acao LIKE '%empresa%';