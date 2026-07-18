import { createHash, timingSafeEqual } from "node:crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_AUTH_SINGLETON = true;

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function timingSafeHexEquals(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function getStoredPasswordHash() {
  const { data, error } = await supabaseAdmin
    .from("admin_auth_settings")
    .select("password_hash")
    .eq("singleton", ADMIN_AUTH_SINGLETON)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data?.password_hash) return data.password_hash;

  const envPassword = process.env.ADMIN_PANEL_PASSWORD?.trim();
  if (envPassword) return sha256(envPassword);

  throw new Error("Senha administrativa indisponível. Salve uma nova senha no painel ou publique novamente o site.");
}

export async function verifyAdminPasswordValue(password: string) {
  const storedHash = await getStoredPasswordHash();
  const providedHash = sha256(password.trim());
  if (!timingSafeHexEquals(providedHash, storedHash)) throw new Error("Senha incorreta");
}

export async function setAdminPasswordValue(password: string) {
  const next = password.trim();
  if (next.length < 4) throw new Error("Senha muito curta");

  const { error } = await supabaseAdmin
    .from("admin_auth_settings")
    .upsert(
      {
        singleton: ADMIN_AUTH_SINGLETON,
        password_hash: sha256(next),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "singleton" },
    );

  if (error) throw new Error(error.message);
}