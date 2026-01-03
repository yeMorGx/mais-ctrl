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
    const reminderDays = [7, 3, 2, 1]; // Dias antes do vencimento para enviar lembrete
    
    let totalNotifications = 0;

    // 1. Verificar assinaturas do plano premium expirando (user_subscriptions)
    logStep("Checking premium subscriptions expiring");
    
    for (const days of reminderDays) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Buscar assinaturas premium que expiram na data alvo
      const { data: expiringPremium, error: premiumError } = await supabase
        .from('user_subscriptions')
        .select(`
          user_id,
          current_period_end,
          plan,
          status
        `)
        .eq('plan', 'premium')
        .eq('status', 'active')
        .gte('current_period_end', `${targetDateStr}T00:00:00`)
        .lt('current_period_end', `${targetDateStr}T23:59:59`);

      if (premiumError) {
        logStep("Error fetching premium subscriptions", { error: premiumError });
        continue;
      }

      logStep(`Found ${expiringPremium?.length || 0} premium subscriptions expiring in ${days} days`);

      for (const sub of expiringPremium || []) {
        // Buscar perfil do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', sub.user_id)
          .single();

        if (profile?.email) {
          try {
            await resend.emails.send({
              from: 'SubsOrganizer <onboarding@resend.dev>',
              to: [profile.email],
              subject: `⚠️ Sua assinatura Premium expira em ${days} dia(s) - SubsOrganizer`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
                  </div>
                  <h2>Olá ${profile.full_name || 'Cliente'}! 👋</h2>
                  <div style="background: #FEF3C7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 18px;"><strong>⚠️ Atenção!</strong></p>
                    <p style="margin: 10px 0 0 0;">Sua assinatura <strong>+Premium</strong> expira em <strong>${days} dia(s)</strong>.</p>
                    <p style="margin: 5px 0 0 0;">Data: ${formatDate(sub.current_period_end)}</p>
                  </div>
                  <p>Renove agora para continuar aproveitando todos os recursos premium!</p>
                  <br>
                  <p><strong>Equipe SubsOrganizer</strong></p>
                </div>
              `,
            });
            totalNotifications++;
            logStep("Premium expiring notification sent", { email: profile.email, days });
          } catch (emailError) {
            logStep("Error sending premium notification", { error: emailError, email: profile.email });
          }
        }
      }
    }

    // 2. Verificar assinaturas do dashboard expirando (subscriptions + shared_subscriptions)
    logStep("Checking dashboard subscriptions expiring");

    for (const days of reminderDays) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Buscar assinaturas pessoais
      const { data: expiringPersonal, error: personalError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          user_id,
          name,
          renewal_date,
          is_active
        `)
        .eq('is_active', true)
        .eq('renewal_date', targetDateStr);

      if (personalError) {
        logStep("Error fetching personal subscriptions", { error: personalError });
        continue;
      }

      logStep(`Found ${expiringPersonal?.length || 0} personal subscriptions expiring in ${days} days`);

      for (const sub of expiringPersonal || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', sub.user_id)
          .single();

        if (profile?.email) {
          try {
            await resend.emails.send({
              from: 'SubsOrganizer <onboarding@resend.dev>',
              to: [profile.email],
              subject: `🔔 Lembrete: ${sub.name} vence em ${days} dia(s)`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
                  </div>
                  <h2>Olá ${profile.full_name || 'Cliente'}! 👋</h2>
                  <div style="background: #DBEAFE; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;"><strong>🔔 Lembrete de Pagamento</strong></p>
                    <p style="margin: 10px 0 0 0;">Sua assinatura <strong>${sub.name}</strong> vence em <strong>${days} dia(s)</strong>.</p>
                    <p style="margin: 5px 0 0 0;">Data de renovação: <strong>${formatDate(sub.renewal_date)}</strong></p>
                  </div>
                  <p>Acesse seu painel para mais detalhes.</p>
                  <br>
                  <p><strong>Equipe SubsOrganizer</strong></p>
                </div>
              `,
            });
            totalNotifications++;
            logStep("Personal subscription reminder sent", { email: profile.email, subscription: sub.name, days });
          } catch (emailError) {
            logStep("Error sending personal reminder", { error: emailError, email: profile.email });
          }
        }
      }

      // Buscar assinaturas compartilhadas (apenas para o dono)
      const { data: expiringShared, error: sharedError } = await supabase
        .from('shared_subscriptions')
        .select(`
          id,
          user_id,
          name,
          renewal_date,
          is_active
        `)
        .eq('is_active', true)
        .eq('renewal_date', targetDateStr);

      if (sharedError) {
        logStep("Error fetching shared subscriptions", { error: sharedError });
        continue;
      }

      logStep(`Found ${expiringShared?.length || 0} shared subscriptions expiring in ${days} days`);

      for (const sub of expiringShared || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', sub.user_id)
          .single();

        if (profile?.email) {
          try {
            await resend.emails.send({
              from: 'SubsOrganizer <onboarding@resend.dev>',
              to: [profile.email],
              subject: `🔔 Lembrete: ${sub.name} (compartilhada) vence em ${days} dia(s)`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
                  </div>
                  <h2>Olá ${profile.full_name || 'Cliente'}! 👋</h2>
                  <div style="background: #E0E7FF; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;"><strong>🔔 Lembrete de Pagamento - Assinatura Compartilhada</strong></p>
                    <p style="margin: 10px 0 0 0;">Sua assinatura <strong>${sub.name}</strong> vence em <strong>${days} dia(s)</strong>.</p>
                    <p style="margin: 5px 0 0 0;">Data de renovação: <strong>${formatDate(sub.renewal_date)}</strong></p>
                  </div>
                  <p>Como você é o responsável por esta assinatura compartilhada, lembre-se de efetuar o pagamento.</p>
                  <br>
                  <p><strong>Equipe SubsOrganizer</strong></p>
                </div>
              `,
            });
            totalNotifications++;
            logStep("Shared subscription reminder sent", { email: profile.email, subscription: sub.name, days });
          } catch (emailError) {
            logStep("Error sending shared reminder", { error: emailError, email: profile.email });
          }
        }
      }
    }

    // 3. Verificar assinaturas vencidas (overdue) - apenas 1 notificação
    logStep("Checking overdue subscriptions");
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Assinaturas pessoais vencidas ontem
    const { data: overduePersonal } = await supabase
      .from('subscriptions')
      .select('id, user_id, name, renewal_date')
      .eq('is_active', true)
      .eq('renewal_date', yesterdayStr);

    for (const sub of overduePersonal || []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', sub.user_id)
        .single();

      if (profile?.email) {
        try {
          await resend.emails.send({
            from: 'SubsOrganizer <onboarding@resend.dev>',
            to: [profile.email],
            subject: `❗ Assinatura ${sub.name} venceu ontem!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
                </div>
                <h2>Olá ${profile.full_name || 'Cliente'}! 👋</h2>
                <div style="background: #FEE2E2; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 16px;"><strong>❗ Pagamento Atrasado</strong></p>
                  <p style="margin: 10px 0 0 0;">Sua assinatura <strong>${sub.name}</strong> venceu ontem (${formatDate(sub.renewal_date)}).</p>
                </div>
                <p>Acesse seu painel para regularizar o pagamento.</p>
                <br>
                <p><strong>Equipe SubsOrganizer</strong></p>
              </div>
            `,
          });
          totalNotifications++;
          logStep("Overdue notification sent", { email: profile.email, subscription: sub.name });
        } catch (emailError) {
          logStep("Error sending overdue notification", { error: emailError, email: profile.email });
        }
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
