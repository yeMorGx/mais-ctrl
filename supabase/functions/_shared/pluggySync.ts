/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared Pluggy helpers used by pluggy-sync and pluggy-webhook.

export async function getPluggyApiKey() {
  const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
  const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Credenciais Pluggy não configuradas");
  const r = await fetch("https://api.pluggy.ai/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!r.ok) throw new Error(`Falha na autenticação Pluggy: ${await r.text()}`);
  return (await r.json()).apiKey as string;
}

async function pluggyGet(path: string, apiKey: string) {
  const r = await fetch(`https://api.pluggy.ai${path}`, {
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
  });
  const body = await r.json();
  if (!r.ok) throw new Error(`Pluggy ${path}: ${JSON.stringify(body)}`);
  return body;
}

/**
 * Fetches an item, its accounts and transactions from Pluggy and persists
 * everything for the given user. Works with any Supabase client (user-scoped
 * or service-role) as long as it can write the pluggy_* tables.
 */
export async function syncPluggyItem(opts: {
  supabase: any;
  userId: string;
  pluggyItemId: string;
  apiKey: string;
  monthsBack?: number;
}) {
  const { supabase, userId, pluggyItemId, apiKey } = opts;
  const monthsBack = opts.monthsBack ?? 12;

  const item = await pluggyGet(`/items/${pluggyItemId}`, apiKey);

  const { data: dbItem, error: itemErr } = await supabase
    .from("pluggy_items")
    .upsert(
      {
        user_id: userId,
        pluggy_item_id: item.id,
        connector_id: item.connector?.id ?? null,
        institution_name: item.connector?.name ?? null,
        institution_logo: item.connector?.imageUrl ?? null,
        status: item.status,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "pluggy_item_id" },
    )
    .select()
    .single();
  if (itemErr) throw itemErr;

  const accJson = await pluggyGet(`/accounts?itemId=${pluggyItemId}`, apiKey);
  const accounts = accJson.results || [];

  const from = new Date();
  from.setMonth(from.getMonth() - monthsBack);
  const fromStr = from.toISOString().slice(0, 10);

  let txCount = 0;

  for (const acc of accounts) {
    const { data: dbAcc, error: accErr } = await supabase
      .from("pluggy_accounts")
      .upsert(
        {
          user_id: userId,
          item_id: dbItem.id,
          pluggy_account_id: acc.id,
          type: acc.type,
          subtype: acc.subtype,
          name: acc.name,
          balance: acc.balance,
          currency: acc.currencyCode || "BRL",
        },
        { onConflict: "pluggy_account_id" },
      )
      .select()
      .single();
    if (accErr) {
      console.error("account upsert failed", accErr);
      continue;
    }

    // Paginate all transactions in the window
    let page = 1;
    let totalPages = 1;
    do {
      const txJson = await pluggyGet(
        `/transactions?accountId=${acc.id}&from=${fromStr}&pageSize=500&page=${page}`,
        apiKey,
      );
      totalPages = txJson.totalPages || 1;
      const rows = (txJson.results || []).map((t: any) => ({
        user_id: userId,
        account_id: dbAcc.id,
        pluggy_transaction_id: t.id,
        description: t.description || t.descriptionRaw || null,
        amount: t.amount,
        currency: t.currencyCode || "BRL",
        date: t.date,
        category: t.category ?? null,
        type: t.type ?? null,
      }));
      if (rows.length > 0) {
        const { error: txErr } = await supabase
          .from("pluggy_transactions")
          .upsert(rows, { onConflict: "pluggy_transaction_id" });
        if (txErr) console.error("tx upsert failed", txErr);
        else txCount += rows.length;
      }
      page += 1;
    } while (page <= totalPages && page <= 20);
  }

  return {
    itemStatus: item.status as string,
    institution: item.connector?.name as string | undefined,
    accounts: accounts.length,
    transactions: txCount,
  };
}
