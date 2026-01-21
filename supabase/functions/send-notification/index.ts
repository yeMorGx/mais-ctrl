import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
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
  | 'payment_reminder'
  | 'trial_started'
  | 'trial_ending'
  | 'trial_ended'
  | 'debt_reminder';

interface NotificationRequest {
  type: NotificationType;
  email: string;
  name?: string;
  data?: {
    subscriptionName?: string;
    expirationDate?: string;
    daysRemaining?: number;
    renewalDate?: string;
    trialEndDate?: string;
    debtName?: string;
    debtValue?: string;
    personName?: string;
    debtType?: 'i_owe' | 'they_owe';
  };
}

// Base email template with modern design
const getBaseTemplate = (content: string, preheader: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>+Ctrl</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0f0f23;
      color: #ffffff;
      line-height: 1.6;
    }
    
    .preheader {
      display: none !important;
      visibility: hidden;
      mso-hide: all;
      font-size: 1px;
      line-height: 1px;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f23;">
  <span class="preheader">${preheader}</span>
  
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f0f23;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; border: 1px solid rgba(139, 92, 246, 0.2); overflow: hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%);">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="display: inline-flex; align-items: center; gap: 8px;">
                      <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-size: 24px; font-weight: 700;">+</span>
                      </div>
                      <span style="font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Ctrl</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(139, 92, 246, 0.1);">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="color: #9CA3AF; font-size: 13px; margin-bottom: 15px;">
                      Feito com 💜 pela equipe +Ctrl
                    </p>
                    <p style="color: #6B7280; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} +Ctrl. Todos os direitos reservados.
                    </p>
                    <p style="color: #6B7280; font-size: 11px; margin-top: 10px;">
                      Gerencie suas assinaturas com inteligência
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Reusable components
const createButton = (text: string, url: string = 'https://more-ctrl.lovable.app/dashboard') => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
    <tr>
      <td style="background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); border-radius: 10px; padding: 14px 32px;">
        <a href="${url}" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`;

const createInfoBox = (icon: string, title: string, content: string, bgColor: string = 'rgba(139, 92, 246, 0.1)', borderColor: string = 'rgba(139, 92, 246, 0.3)') => `
  <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #ffffff;">
      ${icon} ${title}
    </p>
    <p style="margin: 0; color: #D1D5DB; font-size: 14px; line-height: 1.6;">
      ${content}
    </p>
  </div>
`;

const createFeatureList = (features: string[]) => `
  <div style="margin: 20px 0;">
    ${features.map(feature => `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="color: #10B981; font-size: 18px; margin-right: 12px;">✓</span>
        <span style="color: #E5E7EB; font-size: 14px;">${feature}</span>
      </div>
    `).join('')}
  </div>
`;

const createWarningBox = (icon: string, title: string, content: string) => `
  <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #FBBF24;">
      ${icon} ${title}
    </p>
    <p style="margin: 0; color: #FDE68A; font-size: 14px; line-height: 1.6;">
      ${content}
    </p>
  </div>
`;

const createDangerBox = (icon: string, title: string, content: string) => `
  <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #F87171;">
      ${icon} ${title}
    </p>
    <p style="margin: 0; color: #FCA5A5; font-size: 14px; line-height: 1.6;">
      ${content}
    </p>
  </div>
`;

const createSuccessBox = (icon: string, title: string, content: string) => `
  <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #10B981;">
      ${icon} ${title}
    </p>
    <p style="margin: 0; color: #6EE7B7; font-size: 14px; line-height: 1.6;">
      ${content}
    </p>
  </div>
`;

const getEmailTemplate = (type: NotificationType, name: string, data?: NotificationRequest['data']): { subject: string; html: string } => {
  const greeting = `<h2 style="color: #ffffff; font-size: 24px; font-weight: 600; margin-bottom: 20px;">Olá, ${name}! 👋</h2>`;
  
  const templates: Record<NotificationType, { subject: string; content: string; preheader: string }> = {
    welcome: {
      subject: '🎉 Bem-vindo ao +Ctrl! Sua jornada começa agora',
      preheader: 'Comece a organizar suas assinaturas de forma inteligente',
      content: `
        ${greeting}
        <p style="color: #D1D5DB; font-size: 16px; margin-bottom: 20px;">
          Que alegria ter você conosco! 🎉 O <strong style="color: #8B5CF6;">+Ctrl</strong> foi criado para simplificar sua vida financeira.
        </p>
        
        ${createSuccessBox('🚀', 'Conta criada com sucesso!', 'Sua conta está pronta. Agora você pode começar a organizar todas as suas assinaturas em um só lugar.')}
        
        <p style="color: #E5E7EB; font-size: 15px; font-weight: 600; margin: 25px 0 15px;">O que você pode fazer agora:</p>
        ${createFeatureList([
          'Cadastrar suas assinaturas (Netflix, Spotify, etc.)',
          'Receber alertas antes dos vencimentos',
          'Acompanhar quanto gasta por mês',
          'Compartilhar assinaturas com amigos e família',
          'Controlar dívidas com o Debto'
        ])}
        
        ${createButton('Acessar Meu Painel')}
        
        <p style="color: #9CA3AF; font-size: 14px; margin-top: 30px;">
          Qualquer dúvida, estamos sempre à disposição! 💜
        </p>
      `,
    },
    
    subscription_created: {
      subject: '💎 Parabéns! Você agora é Premium no +Ctrl',
      preheader: 'Aproveite todos os recursos exclusivos do plano Premium',
      content: `
        ${greeting}
        <p style="color: #D1D5DB; font-size: 16px; margin-bottom: 20px;">
          Você acaba de desbloquear o melhor do <strong style="color: #8B5CF6;">+Ctrl</strong>! 
          Sua assinatura <strong style="color: #10B981;">Premium</strong> está ativa.
        </p>
        
        ${createSuccessBox('💎', 'Premium Ativado!', 'Agora você tem acesso completo a todos os recursos exclusivos.')}
        
        <p style="color: #E5E7EB; font-size: 15px; font-weight: 600; margin: 25px 0 15px;">Seus benefícios exclusivos:</p>
        ${createFeatureList([
          'Assinaturas ilimitadas',
          'Relatórios e análises detalhadas',
          'Análise financeira com IA',
          '+Share - Compartilhe assinaturas',
          'Debto - Controle de dívidas',
          'Suporte prioritário 24/7',
          'Tema Premium exclusivo',
          'Avatar animado (GIF)'
        ])}
        
        ${createButton('Explorar Recursos Premium')}
        
        <p style="color: #9CA3AF; font-size: 14px; margin-top: 30px;">
          Obrigado por confiar no +Ctrl! Estamos aqui para ajudar você. 💜
        </p>
      `,
    },
    
    subscription_cancelled: {
      subject: '😢 Sua assinatura Premium foi cancelada - +Ctrl',
      preheader: 'Sentiremos sua falta! Você ainda pode aproveitar até o fim do período',
      content: `
        ${greeting}
        <p style="color: #D1D5DB; font-size: 16px; margin-bottom: 20px;">
          Recebemos o cancelamento da sua assinatura <strong style="color: #8B5CF6;">Premium</strong>.
          Sentiremos sua falta! 😢
        </p>
        
        ${createWarningBox('📅', 'Acesso até o fim do período', 'Você ainda pode usar todos os recursos Premium até a data de expiração do seu plano atual.')}
        
        <p style="color: #E5E7EB; font-size: 15px; margin: 25px 0 15px;">
          Após o período, você voltará para o plano gratuito com:
        </p>
        <ul style="color: #9CA3AF; font-size: 14px; margin-left: 20px; line-height: 2;">
          <li>Até 5 assinaturas cadastradas</li>
          <li>Alertas básicos de vencimento</li>
          <li>Visão geral simplificada</li>
        </ul>
        
        ${createInfoBox('💡', 'Mudou de ideia?', 'Você pode renovar sua assinatura a qualquer momento e recuperar todos os benefícios Premium instantaneamente!')}
        
        ${createButton('Renovar Assinatura')}
        
        <p style="color: #9CA3AF; font-size: 14px; margin-top: 30px;">
          Agradecemos por ter feito parte da nossa família Premium! 💜
        </p>
      `,
    },
    
    subscription_expiring: {
      subject: `⚠️ Sua assinatura expira em ${data?.daysRemaining || 'poucos'} dias - +Ctrl`,
      preheader: `Renove agora para não perder seus benefícios Premium`,
      content: `
        ${greeting}
        <p style="color: #D1D5DB; font-size: 16px; margin-bottom: 20px;">
          Sua assinatura <strong style="color: #8B5CF6;">${data?.subscriptionName || 'Premium'}</strong> está chegando ao fim.
        </p>
        
        ${createWarningBox('⏰', `Expira em ${data?.daysRemaining} dia${(data?.daysRemaining || 0) > 1 ? 's' : ''}`, `Data de expiração: ${data?.expirationDate || 'Em breve'}`)}
        
        <p style="color: #E5E7EB; font-size: 15px; margin: 25px 0 15px;">
          Renove agora para continuar aproveitando:
        </p>
        ${createFeatureList([
          'Assinaturas ilimitadas',
          'Análises e relatórios detalhados',
          'Debto e +Share',
          'Suporte prioritário'
        ])}
        
        ${createButton('Renovar Agora')}
        
        <p style="color: #9CA3AF; font-size: 14px; margin-top: 30px;">
          Não perca acesso aos seus recursos favoritos! 💜
        </p>
      `,
    },
    
    password_changed: {
      subject: '🔐 Senha alterada com sucesso - +Ctrl',
      preheader: 'Sua senha foi atualizada. Se não foi você, entre em contato.',
      content: `
        ${greeting}
        <p style="color: #D1D5DB; font-size: 16px; margin-bottom: 20px;">
          Sua senha foi alterada com sucesso no <strong style="color: #8B5CF6;">+Ctrl</strong>.
        </p>
        
        ${createSuccessBox('✅', 'Alteração realizada!', 'Sua nova senha já está ativa e você pode usá-la para fazer login.')}
        
        ${createDangerBox('🚨', 'Não foi você?', 'Se você não solicitou essa alteração, sua conta pode estar comprometida. Entre em contato conosco imediatamente pelo suporte.')}
        
        <p style="color: #9CA3AF; font-size: 14px; margin-top: 30px;">
          <strong>Dicas de segurança:</strong>
        </p>
        <ul style="color: #9CA3AF; font-size: 13px; margin-left: 20px; line-height: 2;">
          <li>Use senhas únicas para cada serviço</li>
          <li>Ative a autenticação em duas etapas (2FA)</li>
          <li>Nunca compartilhe sua senha</li>
        </ul>
        
        ${createButton('Acessar Minha Conta')}
      `,
    },
    
    account_deleted: {
      subject: '👋 Até logo! Sua conta foi excluída - +Ctrl',
      preheader: 'Todos os seus dados foram removidos permanentemente',
      content: `
        <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; margin-bottom: 20px;">Até logo, ${name}! 👋</h2>
        <p style="color: #D1D5DB; font-size: 16px; margin-bottom: 20px;">
          Sua conta no <strong style="color: #8B5CF6;">+Ctrl</strong> foi excluída com sucesso.
        </p>
        
        ${createInfoBox('🗑️', 'Dados removidos', 'Todos os seus dados foram permanentemente excluídos de nossos servidores, incluindo:')}
        
        <ul style="color: #9CA3AF; font-size: 14px; margin-left: 20px; line-height: 2;">
          <li>Informações do perfil</li>
          <li>Assinaturas cadastradas</li>
          <li>Assinaturas compartilhadas</li>
          <li>Histórico e preferências</li>
          <li>Dívidas do Debto</li>
        </ul>
        
        ${createInfoBox('💜', 'Sentiremos sua falta!', 'Se mudar de ideia, você sempre pode criar uma nova conta. Estaremos aqui esperando!')}
        
        <p style="color: #9CA3AF; font-size: 14px; margin-top: 30px;">
          Agradecemos por ter usado o +Ctrl. Desejamos tudo de bom! 🙏
        </p>
      `,
    },
    
    payment_reminder: {
      subject: `🔔 Lembrete: ${data?.subscriptionName} vence em ${data?.daysRemaining} dia${(data?.daysRemaining || 0) > 1 ? 's' : ''} - +Ctrl`,
      preheader: `Não esqueça: ${data?.subscriptionName} vence em breve`,
      content: `
        ${greeting}
        <p style="color: #D1D5DB; font-size: 16px; margin-bottom: 20px;">
          Este é um lembrete sobre uma assinatura que vence em breve.
        </p>
        
        ${createInfoBox('🔔', 'Lembrete de Pagamento', `
          <strong style="color: #ffffff;">Assinatura:</strong> ${data?.subscriptionName}<br>
          <strong style="color: #ffffff;">Vence em:</strong> ${data?.daysRemaining} dia${(data?.daysRemaining || 0) > 1 ? 's' : ''}<br>
          <strong style="color: #ffffff;">Data:</strong> ${data?.renewalDate || 'Em breve'}
        `)}
        
        <p style="color: #9CA3AF; font-size: 14px; margin: 20px 0;">
          💡 <em>Dica: Verifique se há saldo suficiente para evitar cobranças indesejadas.</em>
        </p>
        
        ${createButton('Ver Detalhes no +Ctrl')}
        
        <p style="color: #9CA3AF; font-size: 14px; margin-top: 30px;">
          Você pode gerenciar seus alertas nas configurações do +Ctrl. 💜
        </p>
      `,
    },
    
    trial_started: {
      subject: '🎁 Seu período de teste Premium começou! - +Ctrl',
      preheader: 'Aproveite 7 dias grátis de todos os recursos Premium',
      content: `
        ${greeting}
        <p style="color: #D1D5DB; font-size: 16px; margin-bottom: 20px;">
          Seu período de teste <strong style="color: #10B981;">Premium</strong> começou agora! 🎉
        </p>
        
        ${createSuccessBox('🎁', 'Trial Premium Ativo!', `Você tem acesso completo a todos os recursos Premium até ${data?.trialEndDate || '7 dias'}. Aproveite!`)}
        
        <p style="color: #E5E7EB; font-size: 15px; font-weight: 600; margin: 25px 0 15px;">Explore agora:</p>
        ${createFeatureList([
          'Cadastre assinaturas ilimitadas',
          'Use o Debto para controlar dívidas',
          'Compartilhe assinaturas com +Share',
          'Veja relatórios e análises detalhadas',
          'Experimente o tema Premium exclusivo'
        ])}
        
        ${createButton('Começar a Explorar')}
        
        ${createInfoBox('💡', 'Dica', 'Ao final do período de teste, você pode continuar com o Premium ou voltar ao plano gratuito. Sem compromisso!')}
        
        <p style="color: #9CA3AF; font-size: 14px; margin-top: 30px;">
          Aproveite ao máximo! 💜
        </p>
      `,
    },
    
    trial_ending: {
      subject: `⏰ Seu trial Premium termina em ${data?.daysRemaining} dia${(data?.daysRemaining || 0) > 1 ? 's' : ''} - +Ctrl`,
      preheader: 'Não perca acesso aos recursos Premium',
      content: `
        ${greeting}
        <p style="color: #D1D5DB; font-size: 16px; margin-bottom: 20px;">
          Seu período de teste <strong style="color: #8B5CF6;">Premium</strong> está chegando ao fim.
        </p>
        
        ${createWarningBox('⏰', `Termina em ${data?.daysRemaining} dia${(data?.daysRemaining || 0) > 1 ? 's' : ''}`, `Data: ${data?.trialEndDate || 'Em breve'}`)}
        
        <p style="color: #E5E7EB; font-size: 15px; margin: 25px 0 15px;">
          Gostou do Premium? Continue aproveitando:
        </p>
        ${createFeatureList([
          'Assinaturas ilimitadas',
          'Debto e +Share',
          'Relatórios avançados',
          'Suporte prioritário'
        ])}
        
        ${createButton('Assinar Premium Agora')}
        
        <p style="color: #9CA3AF; font-size: 14px; margin-top: 30px;">
          Não perca seus recursos favoritos! 💜
        </p>
      `,
    },
    
    trial_ended: {
      subject: '📋 Seu período de teste terminou - +Ctrl',
      preheader: 'Obrigado por experimentar o Premium! Veja como continuar',
      content: `
        ${greeting}
        <p style="color: #D1D5DB; font-size: 16px; margin-bottom: 20px;">
          Seu período de teste <strong style="color: #8B5CF6;">Premium</strong> chegou ao fim.
        </p>
        
        ${createInfoBox('📋', 'Trial Finalizado', 'Sua conta agora está no plano gratuito. Você ainda pode usar o +Ctrl com recursos básicos.')}
        
        <p style="color: #E5E7EB; font-size: 15px; margin: 25px 0 15px;">
          No plano gratuito você tem:
        </p>
        <ul style="color: #9CA3AF; font-size: 14px; margin-left: 20px; line-height: 2;">
          <li>Até 5 assinaturas cadastradas</li>
          <li>Alertas básicos de vencimento</li>
          <li>Visão geral simplificada</li>
        </ul>
        
        ${createSuccessBox('💎', 'Quer voltar ao Premium?', 'Assine agora e recupere todos os recursos que você experimentou!')}
        
        ${createButton('Assinar Premium')}
        
        <p style="color: #9CA3AF; font-size: 14px; margin-top: 30px;">
          Obrigado por experimentar o +Ctrl Premium! 💜
        </p>
      `,
    },
    
    debt_reminder: {
      subject: `💰 Lembrete de dívida: ${data?.debtName || 'Pagamento'} - +Ctrl`,
      preheader: `${data?.debtType === 'i_owe' ? 'Você deve' : 'Te devem'}: ${data?.debtValue}`,
      content: `
        ${greeting}
        <p style="color: #D1D5DB; font-size: 16px; margin-bottom: 20px;">
          Este é um lembrete sobre uma dívida registrada no <strong style="color: #8B5CF6;">Debto</strong>.
        </p>
        
        ${data?.debtType === 'i_owe' 
          ? createWarningBox('💸', 'Você deve', `
              <strong style="color: #ffffff;">Para:</strong> ${data?.personName}<br>
              <strong style="color: #ffffff;">Dívida:</strong> ${data?.debtName}<br>
              <strong style="color: #ffffff;">Valor:</strong> ${data?.debtValue}<br>
              <strong style="color: #ffffff;">Vence em:</strong> ${data?.daysRemaining} dia${(data?.daysRemaining || 0) > 1 ? 's' : ''}
            `)
          : createInfoBox('💰', 'Te devem', `
              <strong style="color: #ffffff;">De:</strong> ${data?.personName}<br>
              <strong style="color: #ffffff;">Dívida:</strong> ${data?.debtName}<br>
              <strong style="color: #ffffff;">Valor:</strong> ${data?.debtValue}<br>
              <strong style="color: #ffffff;">Vence em:</strong> ${data?.daysRemaining} dia${(data?.daysRemaining || 0) > 1 ? 's' : ''}
            `)
        }
        
        ${createButton('Ver no Debto')}
        
        <p style="color: #9CA3AF; font-size: 14px; margin-top: 30px;">
          Mantenha suas finanças organizadas com o +Ctrl! 💜
        </p>
      `,
    },
  };

  const template = templates[type];
  return {
    subject: template.subject,
    html: getBaseTemplate(template.content, template.preheader),
  };
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
      from: '+Ctrl <onboarding@resend.dev>',
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
