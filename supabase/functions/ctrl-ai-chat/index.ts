import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_LIMIT = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { messages } = await req.json();

    // Check plan + usage limit
    const { data: sub } = await supabase.from("user_subscriptions").select("plan,status").eq("user_id", user.id).maybeSingle();
    const isPremium = sub?.plan === "premium" && sub?.status === "active";
    const month = new Date().toISOString().slice(0, 7);

    if (!isPremium) {
      const { data: usage } = await supabase.from("ai_usage").select("count").eq("user_id", user.id).eq("month", month).maybeSingle();
      const used = usage?.count || 0;
      if (used >= FREE_LIMIT) {
        return new Response(JSON.stringify({ error: "limit_reached", used, limit: FREE_LIMIT }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Build financial context
    const [{ data: accounts }, { data: txs }, { data: subs }, { data: financings }] = await Promise.all([
      supabase.from("pluggy_accounts").select("name,type,balance,currency").eq("user_id", user.id),
      supabase.from("pluggy_transactions").select("description,amount,date,category").eq("user_id", user.id).order("date", { ascending: false }).limit(100),
      supabase.from("subscriptions").select("name,value,frequency").eq("user_id", user.id),
      supabase.from("financings").select("description,asset_type,monthly_payment,remaining_installments").eq("user_id", user.id),
    ]);

    const totalBalance = (accounts || []).reduce((s: number, a: any) => s + Number(a.balance || 0), 0);
    const monthlySubs = (subs || []).reduce((s: number, x: any) => s + Number(x.price || 0), 0);
    const monthlyFin = (financings || []).reduce((s: number, x: any) => s + Number(x.monthly_payment || 0), 0);

    const context = `
Você é a Ctrl AI, assistente financeira do app +Ctrl, estilo "Pierre" — direta, simpática, em português brasileiro, com tom amigável e prático. Use emojis com moderação. Formate valores em R$.

DADOS DO USUÁRIO:
- Saldo total nas contas conectadas: R$ ${totalBalance.toFixed(2)}
- Contas: ${JSON.stringify(accounts || [])}
- Assinaturas mensais (total R$ ${monthlySubs.toFixed(2)}): ${JSON.stringify(subs || [])}
- Financiamentos (parcela mensal R$ ${monthlyFin.toFixed(2)}): ${JSON.stringify(financings || [])}
- Últimas transações: ${JSON.stringify((txs || []).slice(0, 50))}

REGRAS:
- Baseie respostas SOMENTE nos dados acima.
- Se não tiver dados suficientes, diga e sugira conectar uma conta via Open Finance.
- Dê insights acionáveis (economia, padrões, alertas).
- Seja conciso (máx 4 parágrafos).
`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: context }, ...messages],
      }),
    });

    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Muitas requisições, tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos em Settings > Workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content || "Desculpe, não consegui responder.";

    // Save messages + increment usage
    const lastUser = messages[messages.length - 1];
    await supabase.from("ai_chat_messages").insert([
      { user_id: user.id, role: "user", content: lastUser.content },
      { user_id: user.id, role: "assistant", content },
    ]);

    if (!isPremium) {
      const { data: existing } = await supabase.from("ai_usage").select("count").eq("user_id", user.id).eq("month", month).maybeSingle();
      await supabase.from("ai_usage").upsert({
        user_id: user.id, month, count: (existing?.count || 0) + 1,
      }, { onConflict: "user_id,month" });
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
