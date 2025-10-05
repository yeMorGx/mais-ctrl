import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      from: "Ctrl+ <onboarding@resend.dev>",
      to: [email],
      subject: "Código de Verificação - Redefinição de Senha",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Redefinição de Senha</h1>
          <p style="color: #666; font-size: 16px;">Você solicitou a redefinição de sua senha.</p>
          <p style="color: #666; font-size: 16px;">Use o código abaixo para continuar:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0; color: #333;">${code}</p>
          </div>
          <p style="color: #999; font-size: 14px;">Este código expira em 10 minutos.</p>
          <p style="color: #999; font-size: 14px;">Se você não solicitou esta redefinição, ignore este email.</p>
        </div>
      `,
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
