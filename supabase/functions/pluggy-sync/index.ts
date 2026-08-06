import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getPluggyApiKey, syncPluggyItem } from "../_shared/pluggySync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

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

    const body = await req.json().catch(() => ({}));
    const itemId = body?.itemId;
    if (!itemId || typeof itemId !== "string") return json({ error: "itemId obrigatório" }, 400);

    const apiKey = await getPluggyApiKey();
    const result = await syncPluggyItem({ supabase, userId: user.id, pluggyItemId: itemId, apiKey });

    return json({ success: true, ...result });
  } catch (e) {
    console.error("pluggy-sync error", e);
    return json({ error: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});
