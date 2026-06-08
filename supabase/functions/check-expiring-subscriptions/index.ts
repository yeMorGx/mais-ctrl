import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-EXPIRING] ${step}${detailsStr}`);
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Send SMS via Twilio
const sendSMS = async (to: string, message: string) => {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    logStep("Twilio credentials not configured, skipping SMS");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logStep("SMS send failed", { error });
      return false;
    }

    logStep("SMS sent successfully", { to });
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("SMS error", { error: errorMessage });
    return false;
  }
};

// Send WhatsApp via Twilio
const sendWhatsApp = async (to: string, message: string) => {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    logStep("Twilio credentials not configured, skipping WhatsApp");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
        },
        body: new URLSearchParams({
          To: `whatsapp:${to}`,
          From: `whatsapp:${fromNumber}`,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logStep("WhatsApp send failed", { error });
      return false;
    }

    logStep("WhatsApp sent successfully", { to });
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("WhatsApp error", { error: errorMessage });
    return false;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    if (!resendKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    const resend = new Resend(resendKey);

    const today = new Date();
    const defaultReminderDays = [7, 3, 2, 1];
    
    let totalNotifications = 0;

    // Get all users with their notification preferences
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, email, full_name');

    const userProfiles = new Map(allProfiles?.map(p => [p.id, p]) || []);

    // Get all notification preferences
    const { data: allPrefs } = await supabase
      .from('user_notification_preferences')
      .select('*');

    const userPrefs = new Map(allPrefs?.map(p => [p.user_id, p]) || []);

    // Helper to get user preferences or defaults
    const getUserPrefs = (userId: string) => {
      const prefs = userPrefs.get(userId);
      return {
        email_enabled: prefs?.email_enabled ?? true,
        sms_enabled: prefs?.sms_enabled ?? false,
        whatsapp_enabled: prefs?.whatsapp_enabled ?? false,
        phone_number: prefs?.phone_number || null,
        reminder_days: prefs?.reminder_days || defaultReminderDays,
        reminder_time: prefs?.reminder_time || 'morning',
      };
    };

    // Helper to send notifications based on user preferences
    const sendNotifications = async (
      userId: string, 
      subject: string, 
      emailHtml: string, 
      smsMessage: string
    ) => {
      const profile = userProfiles.get(userId);
      if (!profile?.email) return 0;

      const prefs = getUserPrefs(userId);
      let sent = 0;

      // Send email if enabled
      if (prefs.email_enabled) {
        try {
          await resend.emails.send({
            from: 'SubsOrganizer <onboarding@resend.dev>',
            to: [profile.email],
            subject,
            html: emailHtml,
          });
          sent++;
          logStep("Email sent", { email: profile.email });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logStep("Email failed", { email: profile.email, error: errorMessage });
        }
      }

      // Send SMS if enabled and phone number exists
      if (prefs.sms_enabled && prefs.phone_number) {
        if (await sendSMS(prefs.phone_number, smsMessage)) {
          sent++;
        }
      }

      // Send WhatsApp if enabled and phone number exists
      if (prefs.whatsapp_enabled && prefs.phone_number) {
        if (await sendWhatsApp(prefs.phone_number, smsMessage)) {
          sent++;
        }
      }

      return sent;
    };

    // 1. Check premium subscriptions expiring (user_subscriptions)
    logStep("Checking premium subscriptions expiring");
    
    // Get all active premium subscriptions
    const { data: premiumSubs } = await supabase
      .from('user_subscriptions')
      .select('user_id, current_period_end, plan, status')
      .eq('plan', 'premium')
      .eq('status', 'active')
      .not('current_period_end', 'is', null);

    for (const sub of premiumSubs || []) {
      const prefs = getUserPrefs(sub.user_id);
      const endDate = new Date(sub.current_period_end);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (prefs.reminder_days.includes(daysUntilExpiry)) {
        const profile = userProfiles.get(sub.user_id);
        const name = profile?.full_name || 'Cliente';

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
            </div>
            <h2>Olá ${name}! 👋</h2>
            <div style="background: #FEF3C7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px;"><strong>⚠️ Atenção!</strong></p>
              <p style="margin: 10px 0 0 0;">Sua assinatura <strong>+Premium</strong> expira em <strong>${daysUntilExpiry} dia(s)</strong>.</p>
              <p style="margin: 5px 0 0 0;">Data: ${formatDate(sub.current_period_end)}</p>
            </div>
            <p>Renove agora para continuar aproveitando todos os recursos premium!</p>
            <br>
            <p><strong>Equipe SubsOrganizer</strong></p>
          </div>
        `;

        const smsMessage = `SubsOrganizer: Sua assinatura Premium expira em ${daysUntilExpiry} dia(s) (${formatDate(sub.current_period_end)}). Renove agora!`;

        totalNotifications += await sendNotifications(
          sub.user_id,
          `⚠️ Sua assinatura Premium expira em ${daysUntilExpiry} dia(s)`,
          emailHtml,
          smsMessage
        );
      }
    }

    // 2. Check dashboard subscriptions expiring
    logStep("Checking dashboard subscriptions expiring");

    // Get all active personal subscriptions
    const { data: personalSubs } = await supabase
      .from('subscriptions')
      .select('id, user_id, name, renewal_date')
      .eq('is_active', true);

    for (const sub of personalSubs || []) {
      const prefs = getUserPrefs(sub.user_id);
      const renewalDate = new Date(sub.renewal_date);
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (prefs.reminder_days.includes(daysUntilRenewal)) {
        const profile = userProfiles.get(sub.user_id);
        const name = profile?.full_name || 'Cliente';

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
            </div>
            <h2>Olá ${name}! 👋</h2>
            <div style="background: #DBEAFE; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px;"><strong>🔔 Lembrete de Pagamento</strong></p>
              <p style="margin: 10px 0 0 0;">Sua assinatura <strong>${sub.name}</strong> vence em <strong>${daysUntilRenewal} dia(s)</strong>.</p>
              <p style="margin: 5px 0 0 0;">Data de renovação: <strong>${formatDate(sub.renewal_date)}</strong></p>
            </div>
            <p>Acesse seu painel para mais detalhes.</p>
            <br>
            <p><strong>Equipe SubsOrganizer</strong></p>
          </div>
        `;

        const smsMessage = `SubsOrganizer: ${sub.name} vence em ${daysUntilRenewal} dia(s) (${formatDate(sub.renewal_date)}).`;

        totalNotifications += await sendNotifications(
          sub.user_id,
          `🔔 Lembrete: ${sub.name} vence em ${daysUntilRenewal} dia(s)`,
          emailHtml,
          smsMessage
        );
      }

      // Check for overdue (yesterday)
      if (daysUntilRenewal === -1) {
        const profile = userProfiles.get(sub.user_id);
        const name = profile?.full_name || 'Cliente';

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
            </div>
            <h2>Olá ${name}! 👋</h2>
            <div style="background: #FEE2E2; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px;"><strong>❗ Pagamento Atrasado</strong></p>
              <p style="margin: 10px 0 0 0;">Sua assinatura <strong>${sub.name}</strong> venceu ontem (${formatDate(sub.renewal_date)}).</p>
            </div>
            <p>Acesse seu painel para regularizar o pagamento.</p>
            <br>
            <p><strong>Equipe SubsOrganizer</strong></p>
          </div>
        `;

        const smsMessage = `SubsOrganizer: ATENÇÃO! ${sub.name} venceu ontem. Regularize o pagamento.`;

        totalNotifications += await sendNotifications(
          sub.user_id,
          `❗ Assinatura ${sub.name} venceu ontem!`,
          emailHtml,
          smsMessage
        );
      }
    }

    // 3. Check shared subscriptions expiring
    logStep("Checking shared subscriptions expiring");

    const { data: sharedSubs } = await supabase
      .from('shared_subscriptions')
      .select('id, user_id, name, renewal_date')
      .eq('is_active', true);

    for (const sub of sharedSubs || []) {
      const prefs = getUserPrefs(sub.user_id);
      const renewalDate = new Date(sub.renewal_date);
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (prefs.reminder_days.includes(daysUntilRenewal)) {
        const profile = userProfiles.get(sub.user_id);
        const name = profile?.full_name || 'Cliente';

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
            </div>
            <h2>Olá ${name}! 👋</h2>
            <div style="background: #E0E7FF; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px;"><strong>🔔 Lembrete - Assinatura Compartilhada</strong></p>
              <p style="margin: 10px 0 0 0;">Sua assinatura <strong>${sub.name}</strong> vence em <strong>${daysUntilRenewal} dia(s)</strong>.</p>
              <p style="margin: 5px 0 0 0;">Data de renovação: <strong>${formatDate(sub.renewal_date)}</strong></p>
            </div>
            <p>Como você é o responsável por esta assinatura compartilhada, lembre-se de efetuar o pagamento.</p>
            <br>
            <p><strong>Equipe SubsOrganizer</strong></p>
          </div>
        `;

        const smsMessage = `SubsOrganizer: ${sub.name} (compartilhada) vence em ${daysUntilRenewal} dia(s).`;

        totalNotifications += await sendNotifications(
          sub.user_id,
          `🔔 Lembrete: ${sub.name} (compartilhada) vence em ${daysUntilRenewal} dia(s)`,
          emailHtml,
          smsMessage
        );
      }
    }

    logStep("Function completed", { totalNotifications });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${totalNotifications} notifications` 
      }),
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
