import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface Body {
  email: string;
  link: string;
  couple_name?: string;
  sender_name?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, link, couple_name, sender_name } = (await req.json()) as Body;
    if (!email || !link) {
      return new Response(JSON.stringify({ error: "email e link são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const who = sender_name ? `<strong>${sender_name}</strong>` : "Alguém especial";
    const name = couple_name ? ` <em>${couple_name}</em>` : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Convite +2</title></head>
<body style="margin:0;padding:0;background:#0b0b0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0d;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(180deg,#151517 0%,#0f0f11 100%);border:1px solid rgba(244,63,94,0.25);border-radius:20px;overflow:hidden;">
        <tr><td style="padding:36px 32px 8px;text-align:center;">
          <div style="display:inline-block;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#f43f5e,#ec4899);line-height:64px;font-size:32px;">❤️</div>
          <h1 style="margin:20px 0 4px;font-size:26px;color:#fff;">Você foi convidado(a) para o +2</h1>
          <p style="margin:0;color:#a1a1aa;font-size:14px;">Mais controle para dois.</p>
        </td></tr>
        <tr><td style="padding:24px 32px;color:#e4e4e7;font-size:15px;line-height:1.6;">
          <p>${who} está criando um espaço compartilhado${name} no <strong>+Ctrl</strong> para organizar as finanças do casal — contas, sonhos, investimentos e patrimônio, tudo em um lugar.</p>
          <p>Clique no botão abaixo para aceitar o convite e entrar no espaço:</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${link}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#f43f5e,#ec4899);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:16px;">Aceitar convite ❤️</a>
          </div>
          <p style="color:#71717a;font-size:13px;">Ou copie e cole este link no navegador:<br/><span style="word-break:break-all;color:#a1a1aa;">${link}</span></p>
        </td></tr>
        <tr><td style="padding:20px 32px 32px;border-top:1px solid rgba(255,255,255,0.06);color:#71717a;font-size:12px;text-align:center;">
          Se você não esperava este convite, pode ignorar este e-mail.<br/>
          © +Ctrl · maisctrl.com
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "+Ctrl <noreply@maisctrl.com>",
        to: [email],
        subject: "❤️ Você foi convidado(a) para o +2 no +Ctrl",
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend error", data);
      return new Response(JSON.stringify({ error: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
