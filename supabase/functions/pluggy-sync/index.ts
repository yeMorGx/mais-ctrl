import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getPluggyApiKey() {
  const r = await fetch("https://api.pluggy.ai/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: Deno.env.get("PLUGGY_CLIENT_ID"),
      clientSecret: Deno.env.get("PLUGGY_CLIENT_SECRET"),
    }),
  });
  const j = await r.json();
  return j.apiKey as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { itemId } = await req.json(); // pluggy item id
    if (!itemId) throw new Error("itemId required");

    const apiKey = await getPluggyApiKey();
    const headers = { "X-API-KEY": apiKey, "Content-Type": "application/json" };

    // Get item info
    const itemRes = await fetch(`https://api.pluggy.ai/items/${itemId}`, { headers });
    const item = await itemRes.json();
    if (!itemRes.ok) throw new Error(JSON.stringify(item));

    // Upsert item
    const { data: dbItem, error: itemErr } = await supabase.from("pluggy_items").upsert({
      user_id: user.id,
      pluggy_item_id: item.id,
      connector_id: item.connector?.id,
      institution_name: item.connector?.name,
      institution_logo: item.connector?.imageUrl,
      status: item.status,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: "pluggy_item_id" }).select().single();
    if (itemErr) throw itemErr;

    // Get accounts
    const accRes = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, { headers });
    const accJson = await accRes.json();
    const accounts = accJson.results || [];

    let txCount = 0;
    for (const acc of accounts) {
      const { data: dbAcc, error: accErr } = await supabase.from("pluggy_accounts").upsert({
        user_id: user.id,
        item_id: dbItem.id,
        pluggy_account_id: acc.id,
        type: acc.type,
        subtype: acc.subtype,
        name: acc.name,
        balance: acc.balance,
        currency: acc.currencyCode || "BRL",
      }, { onConflict: "pluggy_account_id" }).select().single();
      if (accErr) { console.error(accErr); continue; }

      // Get transactions (last 90 days)
      const from = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
      const txRes = await fetch(`https://api.pluggy.ai/transactions?accountId=${acc.id}&from=${from}&pageSize=500`, { headers });
      const txJson = await txRes.json();
      const txs = (txJson.results || []).map((t: any) => ({
        user_id: user.id,
        account_id: dbAcc.id,
        pluggy_transaction_id: t.id,
        description: t.description,
        amount: t.amount,
        currency: t.currencyCode || "BRL",
        date: t.date,
        category: t.category,
        type: t.type,
      }));
      if (txs.length > 0) {
        await supabase.from("pluggy_transactions").upsert(txs, { onConflict: "pluggy_transaction_id" });
        txCount += txs.length;
      }
    }

    return new Response(JSON.stringify({ success: true, accounts: accounts.length, transactions: txCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
