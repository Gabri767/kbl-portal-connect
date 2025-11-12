import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, password } = await req.json();

    if (!token || !password) {
      throw new Error('Missing token or password');
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter pelo menos 8 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Find user with this token
    const { data: usuario, error: findError } = await supabase
      .from('usuarios')
      .select('id, nome, email, convite_expires_at, status')
      .eq('convite_token', token)
      .eq('status', 'convite_pendente')
      .single();

    if (findError || !usuario) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if token expired
    const now = new Date();
    const expiresAt = new Date(usuario.convite_expires_at);

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Convite expirado' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Hash password
    const senhaHash = await hashPassword(password);

    // Update user
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        senha_hash: senhaHash,
        status: 'ativo',
        convite_token: null,
        convite_expires_at: null,
      })
      .eq('id', usuario.id);

    if (updateError) throw updateError;

    // Log audit
    await supabase.from('auditoria').insert({
      usuario_id: usuario.id,
      acao: 'senha_definida',
      detalhe: { email: usuario.email },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Senha definida com sucesso! Você já pode fazer login.' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});