import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.2.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { nome, email, password, empresa_id } = await req.json()

    // Validate input
    if (!nome || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Nome, email e senha são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter no mínimo 6 caracteres' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Email já cadastrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Hash password
    const senha_hash = await bcrypt.hash(password)

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from('usuarios')
      .insert({
        nome,
        email,
        senha_hash,
        empresa_id: empresa_id || null,
        departamentos: ['Fiscal'],
      })
      .select()
      .single()

    if (userError) throw userError

    // Create default role (cliente)
    await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.id,
        role: 'cliente'
      })

    // Audit log
    await supabase
      .from('auditoria')
      .insert({
        usuario_id: newUser.id,
        acao: 'register',
        detalhe: { email }
      })

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Erro no cadastro' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
