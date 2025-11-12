import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const empresasApiToken = Deno.env.get('EMPRESAS_API');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch empresas from external API
    if (!empresasApiToken) {
      throw new Error('EMPRESAS_API token not configured');
    }

    console.log('Fetching empresas from external API...');
    const response = await fetch('http://markiiapi.sistemakbl.com:8424/api/acessorias/', {
      headers: {
        'Authorization': `Bearer ${empresasApiToken}`,
      },
    });

    if (!response.ok) {
      console.error('External API error:', response.status, response.statusText);
      throw new Error(`Failed to fetch empresas: ${response.statusText}`);
    }

    const empresasData = await response.json();
    console.log(`Fetched ${empresasData.length || 0} empresas from external API`);

    // Sync empresas to local database
    if (Array.isArray(empresasData) && empresasData.length > 0) {
      for (const empresa of empresasData) {
        // Check if empresa exists
        const { data: existing } = await supabase
          .from('empresas')
          .select('id')
          .eq('cnpj', empresa.cnpj)
          .single();

        const empresaData = {
          razao_social: empresa.razao_social,
          nome_fantasia: empresa.nome_fantasia,
          apelido_continuo: empresa.apelido_continuo,
          cnpj: empresa.cnpj,
          nire: empresa.nire,
          insc_municipal: empresa.insc_municipal,
          dt_ins_municipal: empresa.dt_ins_municipal,
          endereco: empresa.endereco,
          numero: empresa.numero,
          complemento: empresa.complemento,
          cep: empresa.cep,
          bairro: empresa.bairro,
          cidade: empresa.cidade,
          uf: empresa.uf,
          fone: empresa.fone,
          regime: empresa.regime,
          data_abertura: empresa.data_abertura,
          cliente_desde: empresa.cliente_desde,
          cliente_ate: empresa.cliente_ate,
          ativa: empresa.ativa ?? true,
          honorarios: empresa.honorarios,
          website_empresa: empresa.website_empresa,
        };

        if (existing) {
          // Update existing
          await supabase
            .from('empresas')
            .update(empresaData)
            .eq('id', existing.id);
        } else {
          // Insert new
          await supabase
            .from('empresas')
            .insert(empresaData);
        }
      }

      console.log('Empresas synced successfully');
    }

    // Return updated list from database
    const { data: empresas, error: fetchError } = await supabase
      .from('empresas')
      .select('id, razao_social, cnpj, apelido_continuo, ativa')
      .eq('ativa', true)
      .order('razao_social', { ascending: true });

    if (fetchError) throw fetchError;

    return new Response(
      JSON.stringify({ empresas }),
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
