import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function getPluggyApiKey() {
  const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
  const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Credenciais Pluggy não configuradas");
  const r = await fetch("https://api.pluggy.ai/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!r.ok) throw new Error(`Falha na autenticação Pluggy: ${await r.text()}`);
  const j = await r.json();
  return j.apiKey as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    // Optional: itemId => update/reconnect flow for an existing connection
    let itemId: string | undefined;
    try {
      const body = await req.json();
      if (body && typeof body.itemId === "string" && body.itemId.length > 0) itemId = body.itemId;
    } catch { /* no body */ }

    // Ensure the item really belongs to this user before allowing an update token
    if (itemId) {
      const { data: owned } = await supabase
        .from("pluggy_items")
        .select("id")
        .eq("pluggy_item_id", itemId)
        .maybeSingle();
      if (!owned) return json({ error: "Conexão não encontrada" }, 404);
    }

    const apiKey = await getPluggyApiKey();

    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/pluggy-webhook`;
    const payload: Record<string, unknown> = {
      options: {
        clientUserId: user.id,
        webhook: webhookUrl,
      },
    };
    if (itemId) payload.itemId = itemId;

    const r = await fetch("https://api.pluggy.ai/connect_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("connect_token error", r.status, JSON.stringify(data));
      return json({ error: data?.message || "Falha ao gerar token de conexão" }, 502);
    }

    return json({ accessToken: data.accessToken, mode: itemId ? "update" : "create" });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
