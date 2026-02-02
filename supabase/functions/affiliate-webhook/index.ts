import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[AFFILIATE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    logStep("ERROR: STRIPE_SECRET_KEY not set");
    return new Response(JSON.stringify({ error: "Stripe key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // For now, we'll process without signature verification
    // In production, add STRIPE_WEBHOOK_SECRET and verify
    let event: Stripe.Event;
    
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch (err) {
      logStep("Failed to parse webhook body", { error: String(err) });
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Received webhook event", { type: event.type, id: event.id });

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      
      logStep("Processing invoice.paid", {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        amountPaid: invoice.amount_paid,
      });

      // Get customer email to find user
      const customerId = invoice.customer as string;
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        logStep("Customer deleted, skipping");
        return new Response(JSON.stringify({ received: true, skipped: "customer_deleted" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const customerEmail = (customer as Stripe.Customer).email;
      if (!customerEmail) {
        logStep("No customer email, skipping");
        return new Response(JSON.stringify({ received: true, skipped: "no_email" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find user by email
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .single();

      if (profileError || !profile) {
        logStep("User not found by email", { email: customerEmail });
        return new Response(JSON.stringify({ received: true, skipped: "user_not_found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = profile.id;
      logStep("Found user", { userId });

      // Check if user has a referral
      const { data: referral, error: referralError } = await supabaseAdmin
        .from("referrals")
        .select("id, affiliate_id, status")
        .eq("referred_user_id", userId)
        .single();

      if (referralError || !referral) {
        logStep("No referral found for user", { userId });
        return new Response(JSON.stringify({ received: true, skipped: "no_referral" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      logStep("Found referral", { referralId: referral.id, affiliateId: referral.affiliate_id });

      // Check for existing commission to ensure idempotency
      const { data: existingCommission } = await supabaseAdmin
        .from("commissions")
        .select("id")
        .eq("stripe_invoice_id", invoice.id)
        .single();

      if (existingCommission) {
        logStep("Commission already exists for this invoice", { invoiceId: invoice.id });
        return new Response(JSON.stringify({ received: true, skipped: "commission_exists" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calculate 20% commission
      const commissionAmountCents = Math.round(invoice.amount_paid * 0.20);
      const availableAt = new Date();
      availableAt.setDate(availableAt.getDate() + 14); // Available in 14 days

      // Create commission
      const { data: commission, error: commissionError } = await supabaseAdmin
        .from("commissions")
        .insert({
          affiliate_id: referral.affiliate_id,
          referral_id: referral.id,
          stripe_invoice_id: invoice.id,
          amount_cents: commissionAmountCents,
          currency: invoice.currency || "brl",
          status: "pending",
          available_at: availableAt.toISOString(),
          period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
          period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
        })
        .select()
        .single();

      if (commissionError) {
        logStep("Failed to create commission", { error: commissionError.message });
        throw new Error(`Failed to create commission: ${commissionError.message}`);
      }

      logStep("Commission created", {
        commissionId: commission.id,
        amount: commissionAmountCents,
        availableAt: availableAt.toISOString(),
      });

      // If first payment, approve the referral
      if (referral.status === "pending") {
        const { error: updateError } = await supabaseAdmin
          .from("referrals")
          .update({
            status: "approved",
            approved_at: new Date().toISOString(),
          })
          .eq("id", referral.id);

        if (updateError) {
          logStep("Failed to approve referral", { error: updateError.message });
        } else {
          logStep("Referral approved", { referralId: referral.id });
        }
      }

      return new Response(JSON.stringify({ received: true, commission_created: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle charge refunded/disputed for chargeback
    if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
      const charge = event.data.object as Stripe.Charge;
      const invoiceId = charge.invoice as string;

      if (invoiceId) {
        const { error: updateError } = await supabaseAdmin
          .from("commissions")
          .update({ status: "chargeback" })
          .eq("stripe_invoice_id", invoiceId);

        if (updateError) {
          logStep("Failed to mark commission as chargeback", { error: updateError.message });
        } else {
          logStep("Commission marked as chargeback", { invoiceId });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
