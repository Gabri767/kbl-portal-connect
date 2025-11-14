import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_URL = 'http://markiiapi.sistemakbl.com:8424/api/dominio/empresas';

// Função para fazer trim de strings em objetos
function trimObjectStrings(obj: any): any {
  if (typeof obj === 'string') {
    return obj.trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(trimObjectStrings);
  }
  if (obj !== null && typeof obj === 'object') {
    const trimmed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      trimmed[key] = trimObjectStrings(value);
    }
    return trimmed;
  }
  return obj;
}

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

    // Buscar parâmetros de busca
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';

    // Consultar API externa
    let apiResponse;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      apiResponse = await fetch(API_URL, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!apiResponse.ok) {
        throw new Error(`API retornou status ${apiResponse.status}`);
      }
    } catch (fetchError: any) {
      console.error('Erro ao consultar API externa:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao consultar API externa',
          details: fetchError.message 
        }), 
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let empresas = await apiResponse.json();

    // Fazer trim em todas as strings
    empresas = trimObjectStrings(empresas);

    // Aplicar filtro de busca se fornecido
    if (search) {
      const searchLower = search.toLowerCase();
      empresas = empresas.filter((emp: any) => {
        return (
          (emp.nome_emp && emp.nome_emp.toLowerCase().includes(searchLower)) ||
          (emp.razao_emp && emp.razao_emp.toLowerCase().includes(searchLower)) ||
          (emp.cgce_emp && emp.cgce_emp.includes(search)) ||
          (emp.fantasia_emp && emp.fantasia_emp.toLowerCase().includes(searchLower))
        );
      });
    }

    // Registrar auditoria
    await supabase.from('auditoria').insert({
      usuario_id: payload.sub,
      acao: 'CONSULTA_EMPRESAS_API',
      detalhe: {
        api_endpoint: '/api/empresas/list',
        search: search,
        total_resultados: empresas.length,
      },
    });

    console.log(`Retornadas ${empresas.length} empresas da API externa`);

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
