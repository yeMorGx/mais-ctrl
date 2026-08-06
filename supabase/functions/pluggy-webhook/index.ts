import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getPluggyApiKey, syncPluggyItem } from "../_shared/pluggySync.ts";

// Pluggy webhook: called by Pluggy when an item finishes updating or new
// transactions arrive. Public endpoint (no JWT) — we only trust the itemId and
// re-fetch everything from the Pluggy API before persisting.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const payload = await req.json().catch(() => ({}));
    const event: string | undefined = payload?.event;
    const itemId: string | undefined = payload?.itemId || payload?.item?.id;
    console.log("pluggy webhook", event, itemId);

    if (!itemId) return new Response(JSON.stringify({ ignored: true }), { status: 200 });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: dbItem } = await admin
      .from("pluggy_items")
      .select("user_id")
      .eq("pluggy_item_id", itemId)
      .maybeSingle();

    if (!dbItem) {
      console.log("webhook for unknown item", itemId);
      return new Response(JSON.stringify({ ignored: true }), { status: 200 });
    }

    if (event === "item/deleted") {
      await admin.from("pluggy_items").delete().eq("pluggy_item_id", itemId);
      return new Response(JSON.stringify({ deleted: true }), { status: 200 });
    }

    if (event === "item/error" || event === "item/login_error") {
      await admin.from("pluggy_items").update({ status: "LOGIN_ERROR" }).eq("pluggy_item_id", itemId);
      return new Response(JSON.stringify({ flagged: true }), { status: 200 });
    }

    const apiKey = await getPluggyApiKey();
    const result = await syncPluggyItem({
      supabase: admin,
      userId: dbItem.user_id,
      pluggyItemId: itemId,
      apiKey,
      monthsBack: 3,
    });

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pluggy-webhook error", e);
    // Always 200 so Pluggy doesn't retry-storm us on persistent errors
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 200 });
  }
});
