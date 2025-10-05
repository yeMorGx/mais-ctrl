import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      
      // Update user subscription to free
      await supabaseClient
        .from('user_subscriptions')
        .update({ 
          plan: 'free',
          status: 'active',
          stripe_customer_id: null,
          stripe_subscription_id: null
        })
        .eq('user_id', user.id);
      
      return new Response(JSON.stringify({ subscribed: false, plan: 'free' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });

    // Check for active or trialing subscriptions
    const activeSubscription = subscriptions.data.find(
      (sub: any) => sub.status === 'active' || sub.status === 'trialing'
    );

    if (!activeSubscription) {
      logStep("No active or trialing subscription");
      
      await supabaseClient
        .from('user_subscriptions')
        .update({ 
          plan: 'free',
          status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: null
        })
        .eq('user_id', user.id);
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: 'free' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscription = activeSubscription;
    const isTrialing = subscription.status === 'trialing';
    
    // Handle subscription dates - use trial_end for trialing subscriptions
    let subscriptionEnd: string;
    let periodStart: string;
    
    if (isTrialing && subscription.trial_end) {
      subscriptionEnd = new Date(subscription.trial_end * 1000).toISOString();
      // Use created date as start for trial subscriptions
      periodStart = new Date(subscription.created * 1000).toISOString();
    } else {
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      periodStart = new Date(subscription.current_period_start * 1000).toISOString();
    }
    
    logStep("Processing subscription dates", { 
      id: subscription.id, 
      status: subscription.status,
      isTrialing,
      trial_end: subscription.trial_end,
      current_period_start: subscription.current_period_start,
      created: subscription.created,
      calculated_end: subscriptionEnd,
      calculated_start: periodStart
    });

    // Update user subscription status
    const { error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        plan: 'premium',
        status: 'active',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        current_period_start: periodStart,
        current_period_end: subscriptionEnd
      })
      .eq('user_id', user.id);
      
    if (updateError) {
      logStep("ERROR updating subscription", { error: updateError });
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }
    
    logStep("Subscription updated successfully");

    return new Response(JSON.stringify({
      subscribed: true,
      plan: 'premium',
      subscription_end: subscriptionEnd,
      is_trialing: isTrialing,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});