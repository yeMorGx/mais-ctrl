import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getEmailTemplate = (code: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha - +Ctrl</title>
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
                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); border-radius: 14px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 32px; font-weight: 700;">+</span>
                </div>
                <span style="font-size: 28px; font-weight: 700; color: #8B5CF6;">Ctrl</span>
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px 40px;">
              <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; margin-bottom: 20px; text-align: center;">
                🔐 Redefinição de Senha
              </h2>
              
              <p style="color: #D1D5DB; font-size: 16px; text-align: center; margin-bottom: 30px;">
                Você solicitou a redefinição da sua senha. Use o código abaixo para continuar:
              </p>
              
              <!-- Code Box -->
              <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%); border: 2px solid rgba(139, 92, 246, 0.4); border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="color: #9CA3AF; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">
                  Seu código de verificação
                </p>
                <p style="font-size: 48px; font-weight: 700; letter-spacing: 12px; margin: 0; background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                  ${code}
                </p>
              </div>
              
              <!-- Warning -->
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #FBBF24; font-size: 14px; text-align: center;">
                  ⏱️ Este código expira em <strong>10 minutos</strong>
                </p>
              </div>
              
              <!-- Security Notice -->
              <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #FCA5A5; font-size: 13px; text-align: center;">
                  🔒 Se você não solicitou essa redefinição, ignore este email. Sua conta permanece segura.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(139, 92, 246, 0.1);">
              <p style="color: #9CA3AF; font-size: 13px; text-align: center; margin: 0 0 10px 0;">
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (!profiles) {
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ message: "Se o email existir, um código foi enviado" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    console.log("Generated code:", code, "for email:", email);

    // Store code in database (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const { error: insertError } = await supabase
      .from("password_reset_codes")
      .insert({
        email: email.toLowerCase(),
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting code:", insertError);
      throw insertError;
    }

    // Send email with Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { error: emailError } = await resend.emails.send({
      from: "+Ctrl Segurança <onboarding@resend.dev>",
      to: [email],
      subject: "🔐 Código de Verificação - Redefinição de Senha",
      html: getEmailTemplate(code),
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully to:", email);

    return new Response(
      JSON.stringify({ message: "Código enviado com sucesso" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-reset-code:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
