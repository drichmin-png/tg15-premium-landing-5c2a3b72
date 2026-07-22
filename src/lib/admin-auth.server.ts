import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_AUTH_SINGLETON = true;

function isBcryptHash(hash: string) {
  return typeof hash === "string" && /^\$2[aby]\$/.test(hash);
}

function legacySha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function getStoredPasswordHash(): Promise<{ hash: string; source: "db" | "env" }> {
  const { data, error } = await supabaseAdmin
    .from("admin_auth_settings")
    .select("password_hash")
    .eq("singleton", ADMIN_AUTH_SINGLETON)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data?.password_hash) return { hash: data.password_hash, source: "db" };

  const envPassword = process.env.ADMIN_PANEL_PASSWORD?.trim();
  if (envPassword) return { hash: bcrypt.hashSync(envPassword, 10), source: "env" };

  throw new Error(
    "Senha administrativa indisponível. Salve uma nova senha no painel ou publique novamente o site.",
  );
}

async function persistBcryptHash(hash: string) {
  await supabaseAdmin
    .from("admin_auth_settings")
    .upsert(
      { singleton: ADMIN_AUTH_SINGLETON, password_hash: hash, updated_at: new Date().toISOString() },
      { onConflict: "singleton" },
    );
}

export async function verifyAdminPasswordValue(password: string) {
  const pwd = password.trim();
  const { hash: stored, source } = await getStoredPasswordHash();

  let ok = false;
  if (isBcryptHash(stored)) {
    ok = bcrypt.compareSync(pwd, stored);
  } else {
    // Legacy sha256 (unsalted) — verify then transparently upgrade to bcrypt.
    ok = legacySha256(pwd) === stored;
    if (ok && source === "db") {
      try {
        await persistBcryptHash(bcrypt.hashSync(pwd, 10));
      } catch {
        /* best-effort upgrade */
      }
    }
  }
  if (!ok) throw new Error("Senha incorreta");
}

export async function setAdminPasswordValue(password: string) {
  const next = password.trim();
  if (next.length < 8) throw new Error("Senha muito curta (mínimo 8 caracteres)");

  const { error } = await supabaseAdmin
    .from("admin_auth_settings")
    .upsert(
      {
        singleton: ADMIN_AUTH_SINGLETON,
        password_hash: bcrypt.hashSync(next, 10),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "singleton" },
    );

  if (error) throw new Error(error.message);
}
