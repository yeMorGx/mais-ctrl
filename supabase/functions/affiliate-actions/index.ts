import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[AFFILIATE-ACTIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;
    const { action, ...params } = await req.json();

    logStep("Processing action", { action, userId: user.id });

    switch (action) {
      case "become_affiliate": {
        // Check if already an affiliate
        const { data: existing } = await supabaseAdmin
          .from("affiliates")
          .select("id, code")
          .eq("user_id", user.id)
          .single();

        if (existing) {
          return new Response(JSON.stringify({ 
            success: true, 
            affiliate: existing,
            message: "Already an affiliate" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Generate unique code
        const { data: codeResult } = await supabaseAdmin.rpc("generate_affiliate_code");
        const code = codeResult || `AFF${Date.now().toString(36).toUpperCase()}`;

        // Create affiliate
        const { data: affiliate, error: createError } = await supabaseAdmin
          .from("affiliates")
          .insert({
            user_id: user.id,
            code: code,
            pix_key: params.pix_key || null,
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create affiliate: ${createError.message}`);
        }

        logStep("Affiliate created", { affiliateId: affiliate.id, code });

        return new Response(JSON.stringify({ success: true, affiliate }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_affiliate": {
        const { data: affiliate } = await supabaseAdmin
          .from("affiliates")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!affiliate) {
          return new Response(JSON.stringify({ success: true, affiliate: null }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get stats
        const { data: stats } = await supabaseAdmin.rpc("get_affiliate_stats", {
          affiliate_user_id: user.id,
        });

        return new Response(JSON.stringify({ success: true, affiliate, stats }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_commissions": {
        const { data: affiliate } = await supabaseAdmin
          .from("affiliates")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!affiliate) {
          throw new Error("Not an affiliate");
        }

        const { data: commissions } = await supabaseAdmin
          .from("commissions")
          .select("*, referrals(referred_user_id)")
          .eq("affiliate_id", affiliate.id)
          .order("created_at", { ascending: false })
          .limit(50);

        return new Response(JSON.stringify({ success: true, commissions: commissions || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_referrals": {
        const { data: affiliate } = await supabaseAdmin
          .from("affiliates")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!affiliate) {
          throw new Error("Not an affiliate");
        }

        const { data: referrals } = await supabaseAdmin
          .from("referrals")
          .select("*")
          .eq("affiliate_id", affiliate.id)
          .order("created_at", { ascending: false });

        return new Response(JSON.stringify({ success: true, referrals: referrals || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "request_payout": {
        const { pix_key } = params;
        
        if (!pix_key) {
          throw new Error("PIX key is required");
        }

        const { data: affiliate } = await supabaseAdmin
          .from("affiliates")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!affiliate) {
          throw new Error("Not an affiliate");
        }

        // Calculate available balance
        const { data: availableCommissions } = await supabaseAdmin
          .from("commissions")
          .select("id, amount_cents")
          .eq("affiliate_id", affiliate.id)
          .eq("status", "available");

        const availableBalance = (availableCommissions || []).reduce(
          (sum, c) => sum + c.amount_cents,
          0
        );

        // Minimum R$ 50 (5000 cents)
        if (availableBalance < 5000) {
          throw new Error("Saldo mínimo de R$ 50 para saque");
        }

        // Update affiliate PIX key
        await supabaseAdmin
          .from("affiliates")
          .update({ pix_key })
          .eq("id", affiliate.id);

        // Create payout request
        const { data: payout, error: payoutError } = await supabaseAdmin
          .from("payout_requests")
          .insert({
            affiliate_id: affiliate.id,
            amount_cents: availableBalance,
            pix_key: pix_key,
            status: "requested",
          })
          .select()
          .single();

        if (payoutError) {
          throw new Error(`Failed to create payout request: ${payoutError.message}`);
        }

        // Mark commissions as paid (will be confirmed after actual payment)
        const commissionIds = (availableCommissions || []).map((c) => c.id);
        if (commissionIds.length > 0) {
          await supabaseAdmin
            .from("commissions")
            .update({ status: "paid" })
            .in("id", commissionIds);
        }

        logStep("Payout requested", {
          payoutId: payout.id,
          amount: availableBalance,
        });

        return new Response(JSON.stringify({ success: true, payout }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_payouts": {
        const { data: affiliate } = await supabaseAdmin
          .from("affiliates")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!affiliate) {
          throw new Error("Not an affiliate");
        }

        const { data: payouts } = await supabaseAdmin
          .from("payout_requests")
          .select("*")
          .eq("affiliate_id", affiliate.id)
          .order("created_at", { ascending: false });

        return new Response(JSON.stringify({ success: true, payouts: payouts || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "track_referral": {
        // Called on signup to link referral
        const { ref_code } = params;

        if (!ref_code) {
          return new Response(JSON.stringify({ success: false, message: "No ref code" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if user already has a referral (first-touch only)
        const { data: existingReferral } = await supabaseAdmin
          .from("referrals")
          .select("id")
          .eq("referred_user_id", user.id)
          .single();

        if (existingReferral) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: "User already has a referral" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Find affiliate by code
        const { data: affiliate } = await supabaseAdmin
          .from("affiliates")
          .select("id, user_id")
          .eq("code", ref_code.toUpperCase())
          .eq("status", "active")
          .single();

        if (!affiliate) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: "Invalid affiliate code" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Prevent self-referral
        if (affiliate.user_id === user.id) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: "Self-referral not allowed" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Create referral
        const { data: referral, error: refError } = await supabaseAdmin
          .from("referrals")
          .insert({
            affiliate_id: affiliate.id,
            referred_user_id: user.id,
            signup_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (refError) {
          logStep("Failed to create referral", { error: refError.message });
          throw new Error(`Failed to create referral: ${refError.message}`);
        }

        logStep("Referral created", { referralId: referral.id, affiliateId: affiliate.id });

        return new Response(JSON.stringify({ success: true, referral }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_pix_key": {
        const { pix_key } = params;

        const { error: updateError } = await supabaseAdmin
          .from("affiliates")
          .update({ pix_key })
          .eq("user_id", user.id);

        if (updateError) {
          throw new Error(`Failed to update PIX key: ${updateError.message}`);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
