import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const sendSubscriptionEmail = async (
  resend: Resend,
  email: string,
  type: 'cancelled' | 'renewed' | 'created',
  customerName?: string
) => {
  const name = customerName || 'Cliente';
  
  const subjects = {
    cancelled: 'Sua assinatura foi cancelada - SubsOrganizer',
    renewed: 'Sua assinatura foi renovada - SubsOrganizer',
    created: 'Bem-vindo ao SubsOrganizer Premium!',
  };

  const messages = {
    cancelled: `
      <h1>Olá ${name},</h1>
      <p>Sua assinatura do plano +Premium foi cancelada.</p>
      <p>Você ainda terá acesso aos recursos premium até o fim do período atual.</p>
      <p>Se mudou de ideia, você pode renovar sua assinatura a qualquer momento acessando seu painel.</p>
      <br>
      <p>Sentiremos sua falta! 💔</p>
      <p>Equipe SubsOrganizer</p>
    `,
    renewed: `
      <h1>Olá ${name},</h1>
      <p>Sua assinatura do plano +Premium foi renovada com sucesso! 🎉</p>
      <p>Continue aproveitando todos os recursos premium do SubsOrganizer.</p>
      <br>
      <p>Obrigado por continuar conosco!</p>
      <p>Equipe SubsOrganizer</p>
    `,
    created: `
      <h1>Bem-vindo ao +Premium, ${name}! 🎉</h1>
      <p>Sua assinatura foi ativada com sucesso!</p>
      <p>Agora você tem acesso a:</p>
      <ul>
        <li>✅ Assinaturas ilimitadas</li>
        <li>✅ Relatórios detalhados</li>
        <li>✅ Análise financeira avançada</li>
        <li>✅ +Share - Divida assinaturas</li>
        <li>✅ Suporte prioritário</li>
      </ul>
      <br>
      <p>Aproveite!</p>
      <p>Equipe SubsOrganizer</p>
    `,
  };

  try {
    const { error } = await resend.emails.send({
      from: 'SubsOrganizer <onboarding@resend.dev>',
      to: [email],
      subject: subjects[type],
      html: messages[type],
    });

    if (error) {
      logStep('Email send error', { error });
      return false;
    }
    
    logStep('Email sent successfully', { type, email });
    return true;
  } catch (err) {
    logStep('Email send exception', { error: err });
    return false;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!resendKey) throw new Error("RESEND_API_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const resend = new Resend(resendKey);

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    // For now, we'll process without signature verification
    // In production, you should set up STRIPE_WEBHOOK_SECRET and verify
    const event = JSON.parse(body) as Stripe.Event;
    
    logStep("Event type", { type: event.type });

    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        
        if (customer.email) {
          await sendSubscriptionEmail(resend, customer.email, 'created', customer.name || undefined);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        
        if (customer.email) {
          await sendSubscriptionEmail(resend, customer.email, 'cancelled', customer.name || undefined);
        }
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        // Only send renewal email for subscription invoices (not the first one)
        if (invoice.billing_reason === 'subscription_cycle' && invoice.customer) {
          const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
          
          if (customer.email) {
            await sendSubscriptionEmail(resend, customer.email, 'renewed', customer.name || undefined);
          }
        }
        break;
      }
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
