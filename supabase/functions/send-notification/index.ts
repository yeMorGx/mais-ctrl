import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-NOTIFICATION] ${step}${detailsStr}`);
};

type NotificationType = 
  | 'welcome'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'subscription_expiring'
  | 'password_changed'
  | 'account_deleted'
  | 'payment_reminder';

interface NotificationRequest {
  type: NotificationType;
  email: string;
  name?: string;
  data?: {
    subscriptionName?: string;
    expirationDate?: string;
    daysRemaining?: number;
    renewalDate?: string;
  };
}

const getEmailTemplate = (type: NotificationType, name: string, data?: NotificationRequest['data']) => {
  const templates: Record<NotificationType, { subject: string; html: string }> = {
    welcome: {
      subject: '🎉 Bem-vindo ao SubsOrganizer!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
          </div>
          <h2>Olá ${name}! 👋</h2>
          <p>Seja muito bem-vindo ao SubsOrganizer!</p>
          <p>Agora você pode:</p>
          <ul style="line-height: 2;">
            <li>📋 Organizar todas as suas assinaturas em um só lugar</li>
            <li>🔔 Receber alertas antes dos vencimentos</li>
            <li>📊 Acompanhar seus gastos mensais</li>
            <li>🤝 Compartilhar assinaturas com amigos e família</li>
          </ul>
          <p style="margin-top: 20px;">Acesse agora e comece a organizar suas assinaturas!</p>
          <br>
          <p>Qualquer dúvida, estamos à disposição.</p>
          <p><strong>Equipe SubsOrganizer</strong></p>
        </div>
      `,
    },
    subscription_created: {
      subject: '✅ Bem-vindo ao +Premium! - SubsOrganizer',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
          </div>
          <h2>Parabéns, ${name}! 🎉</h2>
          <p>Sua assinatura do plano <strong>+Premium</strong> foi ativada com sucesso!</p>
          <p>Agora você tem acesso completo a:</p>
          <ul style="line-height: 2;">
            <li>✅ Assinaturas ilimitadas</li>
            <li>✅ Relatórios detalhados</li>
            <li>✅ Análise financeira avançada</li>
            <li>✅ +Share - Compartilhe assinaturas</li>
            <li>✅ Suporte prioritário</li>
            <li>✅ Tema Premium exclusivo</li>
          </ul>
          <p style="margin-top: 20px;">Aproveite todos os recursos premium!</p>
          <br>
          <p>Obrigado pela confiança!</p>
          <p><strong>Equipe SubsOrganizer</strong></p>
        </div>
      `,
    },
    subscription_cancelled: {
      subject: '😢 Assinatura cancelada - SubsOrganizer',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
          </div>
          <h2>Olá ${name},</h2>
          <p>Sua assinatura do plano <strong>+Premium</strong> foi cancelada.</p>
          <p>Você ainda terá acesso aos recursos premium até o fim do período atual.</p>
          <p>Após isso, sua conta voltará para o plano gratuito.</p>
          <div style="background: #FEF3C7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>💡 Mudou de ideia?</strong></p>
            <p style="margin: 5px 0 0 0;">Você pode renovar sua assinatura a qualquer momento acessando seu painel.</p>
          </div>
          <p>Sentiremos sua falta! 💔</p>
          <p><strong>Equipe SubsOrganizer</strong></p>
        </div>
      `,
    },
    subscription_expiring: {
      subject: `⚠️ Sua assinatura expira em ${data?.daysRemaining || 'poucos'} dias - SubsOrganizer`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
          </div>
          <h2>Olá ${name},</h2>
          <div style="background: #FEF3C7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;"><strong>⚠️ Atenção!</strong></p>
            <p style="margin: 10px 0 0 0;">Sua assinatura <strong>${data?.subscriptionName || '+Premium'}</strong> expira em <strong>${data?.daysRemaining} dias</strong>.</p>
            <p style="margin: 5px 0 0 0;">Data: ${data?.expirationDate}</p>
          </div>
          <p>Renove agora para continuar aproveitando todos os recursos premium!</p>
          <br>
          <p><strong>Equipe SubsOrganizer</strong></p>
        </div>
      `,
    },
    password_changed: {
      subject: '🔐 Sua senha foi alterada - SubsOrganizer',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
          </div>
          <h2>Olá ${name},</h2>
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
    },
    account_deleted: {
      subject: '👋 Conta excluída - SubsOrganizer',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
          </div>
          <h2>Olá ${name},</h2>
          <p>Sua conta foi excluída com sucesso.</p>
          <p>Todos os seus dados foram removidos permanentemente:</p>
          <ul>
            <li>Informações do perfil</li>
            <li>Assinaturas cadastradas</li>
            <li>Assinaturas compartilhadas</li>
            <li>Histórico de pagamentos</li>
          </ul>
          <p>Sentiremos sua falta! Se mudar de ideia, você sempre pode criar uma nova conta.</p>
          <br>
          <p>Obrigado por ter usado o SubsOrganizer.</p>
          <p><strong>Equipe SubsOrganizer</strong></p>
        </div>
      `,
    },
    payment_reminder: {
      subject: `🔔 Lembrete: ${data?.subscriptionName} vence em ${data?.daysRemaining} dias`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B5CF6;">SubsOrganizer</h1>
          </div>
          <h2>Olá ${name}! 👋</h2>
          <div style="background: #DBEAFE; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;"><strong>🔔 Lembrete de Pagamento</strong></p>
            <p style="margin: 10px 0 0 0;">Sua assinatura <strong>${data?.subscriptionName}</strong> vence em <strong>${data?.daysRemaining} dia(s)</strong>.</p>
            <p style="margin: 5px 0 0 0;">Data de renovação: <strong>${data?.renewalDate}</strong></p>
          </div>
          <p>Acesse seu painel para mais detalhes.</p>
          <br>
          <p><strong>Equipe SubsOrganizer</strong></p>
        </div>
      `,
    },
  };

  return templates[type];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY is not set");

    const resend = new Resend(resendKey);
    const { type, email, name, data }: NotificationRequest = await req.json();

    logStep("Notification request", { type, email, name });

    if (!type || !email) {
      throw new Error("Missing required fields: type and email");
    }

    const template = getEmailTemplate(type, name || 'Cliente', data);

    const { error } = await resend.emails.send({
      from: 'SubsOrganizer <onboarding@resend.dev>',
      to: [email],
      subject: template.subject,
      html: template.html,
    });

    if (error) {
      logStep("Email send error", { error });
      throw new Error(`Failed to send email: ${error.message}`);
    }

    logStep("Email sent successfully", { type, email });

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
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
