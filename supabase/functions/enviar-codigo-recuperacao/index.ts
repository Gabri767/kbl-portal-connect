import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Buscar usuário
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id, nome, email')
      .eq('email', email)
      .single();

    if (userError || !usuario) {
      // Por segurança, não revelamos se o email existe
      return new Response(
        JSON.stringify({ 
          message: 'Se o email estiver cadastrado, você receberá um código de recuperação.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Gerar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const codigoHash = await hashCode(codigo);

    // Expiração: 10 minutos
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Invalidar tokens anteriores
    await supabase
      .from('password_reset_tokens')
      .update({ usado: true })
      .eq('usuario_id', usuario.id)
      .eq('usado', false);

    // Criar novo token
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        usuario_id: usuario.id,
        token_hash: codigoHash,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Erro ao criar token:', tokenError);
      throw new Error('Erro ao processar solicitação');
    }

    // Enviar email via Resend API diretamente
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY não configurada');
      throw new Error('Serviço de email não configurado');
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portal KBL <noreply@sistemakbl.com.br>',
        to: [usuario.email],
        subject: 'Código de Recuperação de Senha - Portal KBL',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #720707;">Recuperação de Senha</h2>
            <p>Olá ${usuario.nome},</p>
            <p>Recebemos uma solicitação para redefinir sua senha no Portal KBL.</p>
            <p>Seu código de verificação é:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${codigo}
            </div>
            <p style="color: #666;">Este código expira em 10 minutos.</p>
            <p style="color: #666;">Se você não solicitou esta recuperação, ignore este email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px;">Portal KBL - Sistema de Gestão Contábil</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Erro ao enviar email:', errorData);
      throw new Error('Erro ao enviar email');
    }

    // Registrar auditoria
    await supabase
      .from('auditoria')
      .insert({
        usuario_id: usuario.id,
        acao: 'solicitacao_recuperacao_senha',
        detalhe: { email: usuario.email }
      });

    return new Response(
      JSON.stringify({ 
        message: 'Se o email estiver cadastrado, você receberá um código de recuperação.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar solicitação' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
