import { createServerFn } from "@tanstack/react-start";

/**
 * Public site configuration synced across all devices.
 * The client stores whatever JSON blob the admin panel needs to render the site.
 * Sensitive fields (senhas, secrets) never chegam ao browser: são bloqueados aqui.
 */

// Fields that must never leave the server
const SENSITIVE_KEYS = new Set(["password", "secretKey", "capiToken"]);

function stripSensitive<T>(input: T): T {
  if (input && typeof input === "object") {
    if (Array.isArray(input)) return input.map(stripSensitive) as unknown as T;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k)) continue;
      out[k] = stripSensitive(v);
    }
    return out as T;
  }
  return input;
}

export const getSiteConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("site_config")
    .select("data, updated_at")
    .eq("singleton", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    data: (data?.data ?? {}) as Record<string, unknown>,
    updated_at: data?.updated_at ?? null,
  };
});

export const verifyAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => input)
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PANEL_PASSWORD;
    if (!expected) throw new Error("Senha administrativa não configurada no servidor");
    if (data.password !== expected) throw new Error("Senha incorreta");
    return { ok: true };
  });

export const saveSiteConfig = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string; data: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PANEL_PASSWORD;
    if (!expected || data.password !== expected) {
      throw new Error("Senha incorreta");
    }
    const clean = stripSensitive(data.data);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_config")
      .update({ data: clean as never })
      .eq("singleton", true);
    if (error) throw new Error(error.message);
    return { ok: true, updated_at: new Date().toISOString() };
  });
