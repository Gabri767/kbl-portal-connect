import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const cep = url.searchParams.get('cep');

    if (!cep) {
      return new Response(JSON.stringify({ error: 'CEP é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Remover caracteres não numéricos
    const cepClean = cep.replace(/\D/g, '');

    if (cepClean.length !== 8) {
      return new Response(JSON.stringify({ error: 'CEP deve ter 8 dígitos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Buscando CEP:', cepClean);

    // Buscar CEP na API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Erro ao consultar CEP' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    if (data.erro) {
      return new Response(JSON.stringify({ error: 'CEP não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('CEP encontrado:', data.localidade);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          endereco: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf,
          complemento: data.complemento,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
