import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// TOTP implementation following RFC 6238
function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  for (const byte of randomBytes) {
    secret += chars[byte % 32];
  }
  return secret;
}

function base32Decode(encoded: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of encoded.toUpperCase()) {
    const val = chars.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return bytes;
}

async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer;
  const dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuffer);
  return new Uint8Array(signature);
}

function intToBytes(num: number): Uint8Array {
  const bytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    bytes[i] = num & 0xff;
    num = Math.floor(num / 256);
  }
  return bytes;
}

async function generateTOTP(secret: string, timeStep: number = 30, digits: number = 6): Promise<string> {
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const timeBytes = intToBytes(time);
  const hmac = await hmacSha1(key, timeBytes);
  
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  
  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

async function verifyTOTP(secret: string, code: string, window: number = 1): Promise<boolean> {
  const timeStep = 30;
  const now = Math.floor(Date.now() / 1000 / timeStep);
  
  // Check current time and surrounding windows for clock skew tolerance
  for (let i = -window; i <= window; i++) {
    const time = now + i;
    const timeBytes = intToBytes(time);
    const key = base32Decode(secret);
    const hmac = await hmacSha1(key, timeBytes);
    
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    
    const otp = (binary % 1000000).toString().padStart(6, "0");
    if (otp === code) {
      return true;
    }
  }
  return false;
}

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    codes.push(code.slice(0, 8));
  }
  return codes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, code, userId } = await req.json();

    switch (action) {
      case "setup": {
        // Generate a new TOTP secret
        const secret = generateSecret();
        const issuer = encodeURIComponent("+Ctrl");
        const accountName = encodeURIComponent(user.email || "user");
        const otpauthUrl = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
        
        // Store the secret temporarily (not enabled yet)
        const { error: updateError } = await supabase
          .from("user_2fa")
          .upsert({
            user_id: user.id,
            secret: secret,
            is_enabled: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (updateError) {
          console.error("Error storing secret:", updateError);
          return new Response(
            JSON.stringify({ error: "Erro ao configurar 2FA" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ 
            secret, 
            otpauthUrl,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify-setup": {
        // Get the stored secret
        const { data: twoFAData, error: fetchError } = await supabase
          .from("user_2fa")
          .select("secret")
          .eq("user_id", user.id)
          .single();

        if (fetchError || !twoFAData?.secret) {
          return new Response(
            JSON.stringify({ error: "2FA não configurado" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify the TOTP code
        const isValid = await verifyTOTP(twoFAData.secret, code);
        
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Código inválido", valid: false }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate backup codes and enable 2FA
        const backupCodes = generateBackupCodes();
        
        const { error: enableError } = await supabase
          .from("user_2fa")
          .update({
            is_enabled: true,
            backup_codes: backupCodes,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (enableError) {
          return new Response(
            JSON.stringify({ error: "Erro ao ativar 2FA" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ valid: true, backupCodes }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify-login": {
        // This is called during login, userId comes from the pending login
        const targetUserId = userId || user.id;
        
        const { data: twoFAData, error: fetchError } = await supabase
          .from("user_2fa")
          .select("secret, backup_codes")
          .eq("user_id", targetUserId)
          .single();

        if (fetchError || !twoFAData?.secret) {
          return new Response(
            JSON.stringify({ error: "2FA não configurado", valid: false }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if it's a backup code
        const isBackupCode = twoFAData.backup_codes?.includes(code.toUpperCase());
        
        if (isBackupCode) {
          // Remove used backup code
          const updatedCodes = twoFAData.backup_codes.filter(
            (c: string) => c !== code.toUpperCase()
          );
          await supabase
            .from("user_2fa")
            .update({ backup_codes: updatedCodes })
            .eq("user_id", targetUserId);
          
          return new Response(
            JSON.stringify({ valid: true, usedBackupCode: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify TOTP code
        const isValid = await verifyTOTP(twoFAData.secret, code);
        
        return new Response(
          JSON.stringify({ valid: isValid }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "disable": {
        const { error: disableError } = await supabase
          .from("user_2fa")
          .update({
            is_enabled: false,
            secret: null,
            backup_codes: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (disableError) {
          return new Response(
            JSON.stringify({ error: "Erro ao desativar 2FA" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Ação inválida" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("TOTP Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
