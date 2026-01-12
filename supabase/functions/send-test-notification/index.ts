import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-TEST-NOTIFICATION] ${step}${detailsStr}`);
};

interface TestNotificationRequest {
  channels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  email: string;
  phone_number: string;
  name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { channels, email, phone_number, name }: TestNotificationRequest = await req.json();
    logStep("Request received", { channels, email, phone_number: phone_number ? "***" : null, name });

    const results: { channel: string; success: boolean; error?: string }[] = [];

    // Test Email
    if (channels.email && email) {
      try {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (!resendKey) throw new Error("RESEND_API_KEY not configured");
        
        const resend = new Resend(resendKey);
        
        const { error } = await resend.emails.send({
          from: 'SubsOrganizer <onboarding@resend.dev>',
          to: [email],
          subject: '✅ Teste de Notificação - SubsOrganizer',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
              </div>
              <h2>Olá ${name}! 👋</h2>
              <div style="background: #DCFCE7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 18px;"><strong>✅ Teste de E-mail bem-sucedido!</strong></p>
                <p style="margin: 10px 0 0 0;">Suas notificações por e-mail estão configuradas corretamente.</p>
              </div>
              <p>Você receberá lembretes de pagamento neste e-mail.</p>
              <br>
              <p><strong>Equipe SubsOrganizer</strong></p>
            </div>
          `,
        });

        if (error) throw new Error(error.message);
        results.push({ channel: 'email', success: true });
        logStep("Email sent successfully");
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.push({ channel: 'email', success: false, error: errorMsg });
        logStep("Email failed", { error: errorMsg });
      }
    }

    // Test SMS
    if (channels.sms && phone_number) {
      try {
        const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
        const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

        if (!twilioSid || !twilioAuth || !twilioPhone) {
          throw new Error("Twilio não está configurado");
        }

        // Clean phone number
        const cleanPhone = phone_number.replace(/\D/g, "");
        const formattedPhone = cleanPhone.startsWith("55") ? `+${cleanPhone}` : `+55${cleanPhone}`;

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const smsBody = `✅ SubsOrganizer: Teste de SMS bem-sucedido! Olá ${name}, suas notificações por SMS estão configuradas corretamente.`;

        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: formattedPhone,
            From: twilioPhone,
            Body: smsBody,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        results.push({ channel: 'sms', success: true });
        logStep("SMS sent successfully");
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.push({ channel: 'sms', success: false, error: errorMsg });
        logStep("SMS failed", { error: errorMsg });
      }
    }

    // Test WhatsApp
    if (channels.whatsapp && phone_number) {
      try {
        const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
        const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

        if (!twilioSid || !twilioAuth || !twilioPhone) {
          throw new Error("Twilio não está configurado");
        }

        // Clean phone number
        const cleanPhone = phone_number.replace(/\D/g, "");
        const formattedPhone = cleanPhone.startsWith("55") ? `+${cleanPhone}` : `+55${cleanPhone}`;

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const whatsappBody = `✅ SubsOrganizer: Teste de WhatsApp bem-sucedido! Olá ${name}, suas notificações por WhatsApp estão configuradas corretamente.`;

        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: `whatsapp:${formattedPhone}`,
            From: `whatsapp:${twilioPhone}`,
            Body: whatsappBody,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        results.push({ channel: 'whatsapp', success: true });
        logStep("WhatsApp sent successfully");
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.push({ channel: 'whatsapp', success: false, error: errorMsg });
        logStep("WhatsApp failed", { error: errorMsg });
      }
    }

    logStep("All tests completed", { results });

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
