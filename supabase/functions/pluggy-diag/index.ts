// Temporary diagnostic: checks whether Pluggy credentials are valid.
// Does NOT return any secret value.
Deno.serve(async () => {
  const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
  const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");
  const out: Record<string, unknown> = {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId?.length ?? 0,
  };
  try {
    const r = await fetch("https://api.pluggy.ai/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    const text = await r.text();
    out.authStatus = r.status;
    out.authOk = r.ok;
    if (!r.ok) out.authError = text.slice(0, 300);
    else {
      const apiKey = JSON.parse(text).apiKey as string;
      const cr = await fetch("https://api.pluggy.ai/connect_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
        body: JSON.stringify({ options: { clientUserId: "diag" } }),
      });
      out.connectTokenStatus = cr.status;
      const ct = await cr.text();
      if (!cr.ok) out.connectTokenError = ct.slice(0, 300);
    }
  } catch (e) {
    out.exception = e instanceof Error ? e.message : "unknown";
  }
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
});
