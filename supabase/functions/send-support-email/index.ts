import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const getAdminEmailTemplate = (name: string, email: string, subject: string, message: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Mensagem de Suporte</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 30px; background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);">
              <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 600;">
                📬 Nova Mensagem de Suporte
              </h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 10px 0 0 0;">
                +Ctrl - Painel de Suporte
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <!-- Sender Info -->
              <div style="background: #f8fafc; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td width="50%">
                      <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Nome</p>
                      <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0;">${name}</p>
                    </td>
                    <td width="50%">
                      <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Email</p>
                      <p style="color: #8B5CF6; font-size: 16px; font-weight: 500; margin: 0;">${email}</p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Subject -->
              <div style="margin-bottom: 25px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase;">Assunto</p>
                <p style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0; padding: 12px 16px; background: #ede9fe; border-radius: 8px; border-left: 4px solid #8B5CF6;">
                  ${subject}
                </p>
              </div>
              
              <!-- Message -->
              <div style="margin-bottom: 25px;">
                <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase;">Mensagem</p>
                <div style="color: #374151; font-size: 15px; line-height: 1.7; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
              
              <!-- Reply CTA -->
              <div style="background: #ecfdf5; border-radius: 10px; padding: 16px; text-align: center;">
                <p style="color: #059669; font-size: 14px; margin: 0;">
                  ↩️ Para responder, basta responder a este email diretamente.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background: #f8fafc; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                +Ctrl Suporte • Recebido em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const getConfirmationEmailTemplate = (name: string, subject: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recebemos sua mensagem - +Ctrl</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f0f23;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; border: 1px solid rgba(139, 92, 246, 0.2); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%);">
              <div style="display: inline-block;">
                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); border-radius: 12px; margin: 0 auto 12px;">
                  <span style="color: white; font-size: 28px; font-weight: 700; line-height: 50px;">+</span>
                </div>
                <span style="font-size: 24px; font-weight: 700; color: #8B5CF6;">Ctrl</span>
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px 40px;">
              <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; margin-bottom: 20px;">
                Olá, ${name}! 👋
              </h2>
              
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #10B981;">
                  ✅ Mensagem recebida!
                </p>
                <p style="margin: 0; color: #6EE7B7; font-size: 14px;">
                  Recebemos sua mensagem e nossa equipe já está analisando.
                </p>
              </div>
              
              <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 10px; padding: 16px; margin-bottom: 25px;">
                <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 6px 0; text-transform: uppercase;">Seu assunto</p>
                <p style="color: #E5E7EB; font-size: 15px; margin: 0; font-weight: 500;">${subject}</p>
              </div>
              
              <p style="color: #D1D5DB; font-size: 15px; margin-bottom: 20px;">
                Nosso tempo médio de resposta é de <strong style="color: #8B5CF6;">até 24 horas</strong> em dias úteis.
              </p>
              
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 10px; padding: 14px;">
                <p style="color: #FBBF24; font-size: 13px; margin: 0; text-align: center;">
                  💡 Enquanto isso, você pode conferir nossa <a href="https://more-ctrl.lovable.app/support" style="color: #FBBF24; text-decoration: underline;">Central de Ajuda</a>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(139, 92, 246, 0.1);">
              <p style="color: #9CA3AF; font-size: 13px; text-align: center; margin: 0 0 8px 0;">
                Feito com 💜 pela equipe +Ctrl
              </p>
              <p style="color: #6B7280; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} +Ctrl. Todos os direitos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: SupportEmailRequest = await req.json();

    console.log("Sending support email from:", email);

    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase
      .from('support_contacts')
      .insert({
        name,
        email,
        subject,
        message,
        status: 'pending'
      });

    if (dbError) {
      console.error("Error saving to database:", dbError);
      throw dbError;
    }

    // Send email to admin
    await resend.emails.send({
      from: "+Ctrl Suporte <onboarding@resend.dev>",
      to: ["maisctrlsuporte@gmail.com"],
      replyTo: email,
      subject: `[Suporte] ${subject}`,
      html: getAdminEmailTemplate(name, email, subject, message),
    });

    // Send confirmation email to user
    await resend.emails.send({
      from: "+Ctrl Suporte <onboarding@resend.dev>",
      to: [email],
      subject: "✅ Recebemos sua mensagem - +Ctrl",
      html: getConfirmationEmailTemplate(name, subject),
    });

    console.log("Emails sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error in send-support-email function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
