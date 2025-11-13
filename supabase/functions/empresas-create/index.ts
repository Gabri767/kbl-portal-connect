import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const jwtSecret = Deno.env.get('JWT_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar token JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Token não fornecido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    let payload;
    try {
      payload = await verify(token, key);
    } catch (e) {
      console.error('JWT verification failed:', e);
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar role (admin ou gestor)
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', payload.sub);

    const isAdmin = userRoles?.some((r: any) => r.role === 'admin');
    const isGestor = userRoles?.some((r: any) => r.role === 'gestor');

    if (!isAdmin && !isGestor) {
      return new Response(JSON.stringify({ error: 'Permissão negada' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();

    // Validações básicas
    if (!body.razao_social) {
      return new Response(JSON.stringify({ error: 'Razão social é obrigatória' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar CNPJ se fornecido
    if (body.cnpj) {
      const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
      const cnpjClean = body.cnpj.replace(/\D/g, '');
      if (cnpjClean.length !== 14) {
        return new Response(JSON.stringify({ error: 'CNPJ inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Inserir empresa
    const { data: empresa, error } = await supabase
      .from('empresas')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Error inserting empresa:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Registrar auditoria
    await supabase.from('auditoria').insert({
      acao: 'criar_empresa',
      usuario_id: payload.sub,
      detalhe: { razao_social: body.razao_social, empresa_id: empresa.id },
    });

    console.log('Empresa criada com sucesso:', empresa.id);

    return new Response(JSON.stringify({ success: true, data: empresa }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
