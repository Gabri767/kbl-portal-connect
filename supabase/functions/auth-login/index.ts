import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.2.4/mod.ts'
import { create } from 'https://deno.land/x/djwt@v3.0.1/mod.ts'

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email e senha são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Credenciais inválidas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check if account is blocked
    if (user.bloqueado_until && new Date(user.bloqueado_until) > new Date()) {
      return new Response(
        JSON.stringify({ error: 'Conta temporariamente bloqueada. Tente novamente mais tarde.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.senha_hash)

    if (!passwordMatch) {
      // Increment failed attempts
      const tentativas = (user.tentativas_login || 0) + 1
      const updates: any = { tentativas_login: tentativas }

      // Block account after 5 failed attempts
      if (tentativas >= 5) {
        const bloqueadoAte = new Date()
        bloqueadoAte.setMinutes(bloqueadoAte.getMinutes() + 15)
        updates.bloqueado_until = bloqueadoAte.toISOString()
      }

      await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', user.id)

      return new Response(
        JSON.stringify({ error: 'Credenciais inválidas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Reset failed attempts on successful login
    await supabase
      .from('usuarios')
      .update({ tentativas_login: 0, bloqueado_until: null })
      .eq('id', user.id)

    // Get user role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const role = userRoles && userRoles.length > 0 ? userRoles[0].role : 'cliente'

    // Create JWT token
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const token = await create(
      { alg: 'HS256', typ: 'JWT' },
      {
        sub: user.id,
        email: user.email,
        nome: user.nome,
        empresa_id: user.empresa_id,
        departamentos: user.departamentos,
        role: role,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
      },
      key
    )

    // Audit log
    await supabase
      .from('auditoria')
      .insert({
        usuario_id: user.id,
        acao: 'login',
        detalhe: { email }
      })

    return new Response(
      JSON.stringify({
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          empresa_id: user.empresa_id,
          departamentos: user.departamentos,
          role: role
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Erro no login' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
