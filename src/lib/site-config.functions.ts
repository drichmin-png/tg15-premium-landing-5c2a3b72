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

function normalizeNamespace(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().toLowerCase();
  return trimmed || null;
}

export const getSiteConfig = createServerFn({ method: "GET" })
  .inputValidator((input: { namespace?: string | null } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const ns = normalizeNamespace(data?.namespace);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const query = supabaseAdmin.from("site_config").select("data, updated_at");
    const { data: row, error } = ns
      ? await query.eq("namespace", ns).maybeSingle()
      : await query.eq("singleton", true).maybeSingle();
    if (error) throw new Error(error.message);
    return {
      data: JSON.stringify(row?.data ?? {}),
      updated_at: row?.updated_at ?? null,
    };
  });

export const verifyAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => input)
  .handler(async ({ data }) => {
    const { verifyAdminPasswordValue } = await import("@/lib/admin-auth.server");
    await verifyAdminPasswordValue(data.password);
    return { ok: true };
  });

export const changeAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((input: { currentPassword: string; nextPassword: string }) => input)
  .handler(async ({ data }) => {
    const { setAdminPasswordValue, verifyAdminPasswordValue } = await import("@/lib/admin-auth.server");
    await verifyAdminPasswordValue(data.currentPassword);
    await setAdminPasswordValue(data.nextPassword);
    return { ok: true };
  });

export const saveSiteConfig = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string; data: string; namespace?: string | null }) => input)
  .handler(async ({ data }) => {
    const { verifyAdminPasswordValue } = await import("@/lib/admin-auth.server");
    await verifyAdminPasswordValue(data.password);
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.data);
    } catch {
      throw new Error("Payload inválido");
    }
    const clean = stripSensitive(parsed);
    const ns = normalizeNamespace(data.namespace);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const finder = supabaseAdmin.from("site_config").select("id");
    const { data: existing, error: findError } = ns
      ? await finder.eq("namespace", ns).maybeSingle()
      : await finder.eq("singleton", true).maybeSingle();
    if (findError) throw new Error(findError.message);

    const updated_at = new Date().toISOString();
    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("site_config")
        .update({ data: clean as never, updated_at })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("site_config").insert({
        singleton: !ns,
        namespace: ns,
        data: clean as never,
        updated_at,
      });
      if (error) throw new Error(error.message);
    }

    return { ok: true, updated_at };
  });

