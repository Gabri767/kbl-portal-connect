import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, codigo, novaSenha } = await req.json();

    if (!email || !codigo || !novaSenha) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validar senha
    if (novaSenha.length < 8) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter no mínimo 8 caracteres' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Buscar usuário
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !usuario) {
      return new Response(
        JSON.stringify({ error: 'Email não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Hash do código fornecido
    const codigoHash = await hashCode(codigo);

    // Buscar token válido
    const { data: token, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('usuario_id', usuario.id)
      .eq('token_hash', codigoHash)
      .eq('usado', false)
      .gt('expires_at', new Date().toISOString())
      .order('criado_em', { ascending: false })
      .limit(1)
      .single();

    if (tokenError || !token) {
      return new Response(
        JSON.stringify({ error: 'Código inválido ou expirado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Hash da nova senha
    const senhaHash = await hashPassword(novaSenha);

    // Atualizar senha
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ senha_hash: senhaHash })
      .eq('id', usuario.id);

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      throw new Error('Erro ao redefinir senha');
    }

    // Marcar token como usado
    await supabase
      .from('password_reset_tokens')
      .update({ usado: true })
      .eq('id', token.id);

    // Registrar auditoria
    await supabase
      .from('auditoria')
      .insert({
        usuario_id: usuario.id,
        acao: 'redefinicao_senha',
        detalhe: { email: usuario.email }
      });

    return new Response(
      JSON.stringify({ message: 'Senha redefinida com sucesso!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar solicitação' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
