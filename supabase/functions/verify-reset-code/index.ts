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
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      throw new Error("Email, código e nova senha são obrigatórios");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find valid code
    const { data: resetCode, error: findError } = await supabase
      .from("password_reset_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("Error finding code:", findError);
      throw findError;
    }

    if (!resetCode) {
      return new Response(
        JSON.stringify({ error: "Código inválido ou expirado" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("email", email.toLowerCase())
      .single();

    if (!profile) {
      throw new Error("Usuário não encontrado");
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw updateError;
    }

    // Mark code as used
    await supabase
      .from("password_reset_codes")
      .update({ used: true })
      .eq("id", resetCode.id);

    // Send password changed notification
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: 'SubsOrganizer <onboarding@resend.dev>',
          to: [email],
          subject: '🔐 Sua senha foi alterada - SubsOrganizer',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
              </div>
              <h2>Olá ${profile.full_name || 'Cliente'},</h2>
              <p>Sua senha foi alterada com sucesso.</p>
              <div style="background: #DCFCE7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>✅ Alteração realizada</strong></p>
                <p style="margin: 5px 0 0 0;">Sua nova senha já está ativa.</p>
              </div>
              <div style="background: #FEE2E2; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>⚠️ Não foi você?</strong></p>
                <p style="margin: 5px 0 0 0;">Se você não solicitou essa alteração, entre em contato conosco imediatamente.</p>
              </div>
              <p><strong>Equipe SubsOrganizer</strong></p>
            </div>
          `,
        });
        console.log("Password change notification sent to:", email);
      }
    } catch (notifError) {
      console.error("Failed to send password change notification:", notifError);
    }

    console.log("Password reset successfully for:", email);

    return new Response(
      JSON.stringify({ message: "Senha redefinida com sucesso" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in verify-reset-code:", error);
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
