-- Corrigir search_path da função convert_to_uuid
CREATE OR REPLACE FUNCTION public.convert_to_uuid(input_text text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
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