import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key-change-this'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token ausente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const payload = await verify(token, key)

    return new Response(
      JSON.stringify({
        user: {
          id: payload.sub,
          nome: payload.nome,
          email: payload.email,
          empresa_id: payload.empresa_id,
          departamentos: payload.departamentos,
          role: payload.role
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Token verification error:', error)
    return new Response(
      JSON.stringify({ error: 'Token inválido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    )
  }
})
