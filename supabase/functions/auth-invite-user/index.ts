import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key-change-this';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token
    let userId: string;
    try {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(JWT_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );

      const payload = await verify(token, key);
      userId = payload.sub as string;
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if user has permission (admin or gestor)
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) throw roleError;

    const userRole = userRoles?.[0]?.role;
    if (!userRole || !['admin', 'gestor'].includes(userRole)) {
      throw new Error('Insufficient permissions');
    }

    const { nome, email, role, departamentos, empresas } = await req.json();

    // Validation
    if (!nome || !email || !role || !departamentos || !empresas) {
      throw new Error('Missing required fields');
    }

    // Gestor can only invite colaborador and cliente
    if (userRole === 'gestor' && !['colaborador', 'cliente'].includes(role)) {
      throw new Error('Gestores can only invite colaborador or cliente');
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Email já cadastrado' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Generate invite token and expiration (48 hours)
    const conviteToken = crypto.randomUUID();
    const conviteExpiresAt = new Date();
    conviteExpiresAt.setHours(conviteExpiresAt.getHours() + 48);

    // Create user
    const { data: newUser, error: insertError } = await supabase
      .from('usuarios')
      .insert({
        nome,
        email,
        departamentos,
        senha_hash: '', // Will be set when user accepts invite
        status: 'convite_pendente',
        convite_token: conviteToken,
        convite_expires_at: conviteExpiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Set user role
    await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.id,
        role,
      });

    // Link user to empresas
    if (empresas && empresas.length > 0) {
      const empresaLinks = empresas.map((empresaId: string) => ({
        usuario_id: newUser.id,
        empresa_id: empresaId,
      }));

      await supabase
        .from('usuarios_empresas')
        .insert(empresaLinks);
    }

    // Log audit
    await supabase.from('auditoria').insert({
      usuario_id: user.id,
      acao: 'convite_enviado',
      detalhe: { email, role, convidado_por: user.email },
    });

    // Generate invitation link (email sending to be implemented separately)
    const inviteLink = `${req.headers.get('origin')}/definir-senha/${conviteToken}`;

    console.log(`Invite link for ${email}: ${inviteLink}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite enviado com sucesso',
        inviteLink // For testing without email configured
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