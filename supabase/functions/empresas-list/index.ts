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

    console.log('Listando empresas para usuário:', payload.sub);

    // Buscar empresas com joins para os responsáveis
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select(`
        *,
        comercial_user:usuarios!empresas_comercial_fkey(nome),
        compliance_fiscal_user:usuarios!empresas_compliance_fiscal_fkey(nome),
        compliance_tributario_user:usuarios!empresas_compliance_tributario_fkey(nome),
        conciliacao_contabil_user:usuarios!empresas_conciliacao_contabil_fkey(nome),
        contabil_user:usuarios!empresas_contabil_fkey(nome),
        controladoria_user:usuarios!empresas_controladoria_fkey(nome),
        financeiro_user:usuarios!empresas_financeiro_fkey(nome),
        fiscal_user:usuarios!empresas_fiscal_fkey(nome),
        gente_e_gestao_user:usuarios!empresas_gente_e_gestao_fkey(nome),
        pessoal_user:usuarios!empresas_pessoal_fkey(nome),
        folha_user:usuarios!empresas_folha_de_pagamento_kit_mensal_fkey(nome),
        societario_user:usuarios!empresas_societario_fkey(nome),
        sucesso_user:usuarios!empresas_sucesso_do_cliente_fkey(nome)
      `)
      .order('razao_social');

    if (error) {
      console.error('Error fetching empresas:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Encontradas ${empresas?.length || 0} empresas`);

    return new Response(JSON.stringify({ success: true, data: empresas }), {
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
