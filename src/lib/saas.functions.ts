import { createServerFn } from "@tanstack/react-start";

// ============================================================
// SaaS multi-tenant server functions (Fase 1)
// ============================================================

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ---------- session ----------

export const getCurrentSession = createServerFn({ method: "GET" }).handler(async () => {
  const { getSaasSession } = await import("@/lib/saas-auth.server");
  const session = await getSaasSession();
  if (!session.data?.userId) return null;
  const sb = await admin();
  let tenant: { id: string; slug: string; company_name: string; status: string } | null = null;
  if (session.data.tenantId) {
    const { data } = await sb
      .from("tenants")
      .select("id, slug, company_name, status")
      .eq("id", session.data.tenantId)
      .maybeSingle();
    tenant = data ?? null;
  }
  return {
    userId: session.data.userId,
    username: session.data.username ?? "",
    role: session.data.role!,
    tenantId: session.data.tenantId ?? null,
    tenantSlug: session.data.tenantSlug ?? null,
    tenant,
    impersonation: session.data.impersonation ?? null,
  };
});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const { getSaasSession } = await import("@/lib/saas-auth.server");
  const session = await getSaasSession();
  // if impersonating, close the log entry
  if (session.data?.impersonation) {
    const sb = await admin();
    await sb
      .from("impersonation_logs")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", session.data.impersonation.logId);
  }
  await session.clear();
  return { ok: true };
});

// ---------- login ----------

export const masterLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string; password: string }) => input)
  .handler(async ({ data }) => {
    const { getSaasSession, verifyPassword } = await import("@/lib/saas-auth.server");
    const sb = await admin();
    const { data: user, error } = await sb
      .from("app_users")
      .select("id, username, role, tenant_id, password_hash, password_salt, status")
      .eq("username", data.username.trim())
      .eq("role", "master")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!user || user.status !== "active") throw new Error("Usuário ou senha inválidos");
    if (!verifyPassword(data.password, user.password_salt, user.password_hash))
      throw new Error("Usuário ou senha inválidos");

    await sb.from("app_users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

    const session = await getSaasSession();
    await session.update({
      userId: user.id,
      username: user.username,
      role: "master",
      tenantId: null,
      tenantSlug: null,
    });
    return { ok: true };
  });

export const tenantLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; username: string; password: string }) => input)
  .handler(async ({ data }) => {
    const { getSaasSession, verifyPassword } = await import("@/lib/saas-auth.server");
    const sb = await admin();

    const { data: tenant, error: tErr } = await sb
      .from("tenants")
      .select("id, slug, status")
      .eq("slug", data.slug.toLowerCase())
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!tenant) throw new Error("Operador não encontrado");
    if (tenant.status === "blocked") throw new Error("Conta bloqueada. Fale com o administrador.");
    if (tenant.status === "inactive") throw new Error("Conta inativa.");

    const { data: user, error } = await sb
      .from("app_users")
      .select("id, username, role, password_hash, password_salt, status")
      .eq("tenant_id", tenant.id)
      .eq("username", data.username.trim())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!user || user.status !== "active") throw new Error("Usuário ou senha inválidos");
    if (!verifyPassword(data.password, user.password_salt, user.password_hash))
      throw new Error("Usuário ou senha inválidos");

    await sb.from("app_users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);
    await sb.from("tenants").update({ last_login_at: new Date().toISOString() }).eq("id", tenant.id);

    const session = await getSaasSession();
    await session.update({
      userId: user.id,
      username: user.username,
      role: user.role as "owner" | "staff",
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    });
    return { ok: true };
  });

// ---------- master-only helpers ----------

async function requireMaster() {
  const { getSaasSession } = await import("@/lib/saas-auth.server");
  const session = await getSaasSession();
  const isMaster =
    session.data?.role === "master" ||
    session.data?.impersonation != null; // master impersonating a tenant is still master
  if (!isMaster) throw new Error("Acesso negado");
  return session;
}

// ---------- tenants CRUD ----------

export const listTenants = createServerFn({ method: "GET" }).handler(async () => {
  await requireMaster();
  const sb = await admin();
  const { data, error } = await sb
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const createTenant = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      slug: string;
      company_name: string;
      responsible_name?: string;
      contact_email?: string;
      contact_phone?: string;
      plan?: string;
      order_limit?: number;
      product_limit?: number;
      user_limit?: number;
      expires_at?: string | null;
      owner_username: string;
      owner_password: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    await requireMaster();
    const { hashPassword } = await import("@/lib/saas-auth.server");
    const slug = data.slug.trim().toLowerCase();
    if (!SLUG_RE.test(slug))
      throw new Error("Slug inválido. Use apenas letras minúsculas, números e hífen (2–40 caracteres).");
    if (!data.company_name.trim()) throw new Error("Nome da empresa é obrigatório");
    if (!data.owner_username.trim()) throw new Error("Usuário do dono é obrigatório");
    if (!data.owner_password || data.owner_password.length < 4)
      throw new Error("Senha do dono muito curta (mínimo 4)");

    const sb = await admin();
    const { data: tenant, error } = await sb
      .from("tenants")
      .insert({
        slug,
        company_name: data.company_name.trim(),
        responsible_name: data.responsible_name?.trim() ?? "",
        contact_email: data.contact_email?.trim() ?? "",
        contact_phone: data.contact_phone?.trim() ?? "",
        plan: data.plan ?? "starter",
        status: "active",
        order_limit: data.order_limit ?? 0,
        product_limit: data.product_limit ?? 0,
        user_limit: data.user_limit ?? 3,
        expires_at: data.expires_at ?? null,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("Já existe um operador com esse slug");
      throw new Error(error.message);
    }

    const { salt, hash } = hashPassword(data.owner_password);
    const { error: uErr } = await sb.from("app_users").insert({
      tenant_id: tenant.id,
      username: data.owner_username.trim(),
      password_salt: salt,
      password_hash: hash,
      role: "owner",
      display_name: data.responsible_name?.trim() || data.company_name.trim(),
    });
    if (uErr) {
      // rollback tenant
      await sb.from("tenants").delete().eq("id", tenant.id);
      throw new Error(uErr.message);
    }
    return tenant;
  });

export const updateTenant = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      id: string;
      company_name?: string;
      responsible_name?: string;
      contact_email?: string;
      contact_phone?: string;
      plan?: string;
      order_limit?: number;
      product_limit?: number;
      user_limit?: number;
      expires_at?: string | null;
    }) => input,
  )
  .handler(async ({ data }) => {
    await requireMaster();
    const sb = await admin();
    const patch: {
      company_name?: string;
      responsible_name?: string;
      contact_email?: string;
      contact_phone?: string;
      plan?: string;
      order_limit?: number;
      product_limit?: number;
      user_limit?: number;
      expires_at?: string | null;
    } = {};
    if (data.company_name !== undefined) patch.company_name = data.company_name;
    if (data.responsible_name !== undefined) patch.responsible_name = data.responsible_name;
    if (data.contact_email !== undefined) patch.contact_email = data.contact_email;
    if (data.contact_phone !== undefined) patch.contact_phone = data.contact_phone;
    if (data.plan !== undefined) patch.plan = data.plan;
    if (data.order_limit !== undefined) patch.order_limit = data.order_limit;
    if (data.product_limit !== undefined) patch.product_limit = data.product_limit;
    if (data.user_limit !== undefined) patch.user_limit = data.user_limit;
    if (data.expires_at !== undefined) patch.expires_at = data.expires_at;
    const { error } = await sb.from("tenants").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setTenantStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; status: "active" | "blocked" | "inactive" }) => input)
  .handler(async ({ data }) => {
    await requireMaster();
    const sb = await admin();
    const { error } = await sb.from("tenants").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTenant = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await requireMaster();
    const sb = await admin();
    const { error } = await sb.from("tenants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetTenantOwnerPassword = createServerFn({ method: "POST" })
  .inputValidator((input: { tenantId: string; newPassword: string }) => input)
  .handler(async ({ data }) => {
    await requireMaster();
    if (!data.newPassword || data.newPassword.length < 4)
      throw new Error("Senha muito curta");
    const { hashPassword } = await import("@/lib/saas-auth.server");
    const sb = await admin();
    const { salt, hash } = hashPassword(data.newPassword);
    const { error } = await sb
      .from("app_users")
      .update({ password_salt: salt, password_hash: hash })
      .eq("tenant_id", data.tenantId)
      .eq("role", "owner");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- impersonation ----------

export const impersonateTenant = createServerFn({ method: "POST" })
  .inputValidator((input: { tenantId: string }) => input)
  .handler(async ({ data }) => {
    const { getSaasSession } = await import("@/lib/saas-auth.server");
    const session = await getSaasSession();
    if (session.data?.role !== "master" || !session.data?.userId)
      throw new Error("Somente o Admin Master pode entrar como operador");
    const sb = await admin();
    const { data: tenant, error: tErr } = await sb
      .from("tenants")
      .select("id, slug")
      .eq("id", data.tenantId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!tenant) throw new Error("Operador não encontrado");
    const { data: owner, error: oErr } = await sb
      .from("app_users")
      .select("id, username")
      .eq("tenant_id", tenant.id)
      .eq("role", "owner")
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!owner) throw new Error("Operador sem dono cadastrado");

    const { data: log, error: lErr } = await sb
      .from("impersonation_logs")
      .insert({ master_user_id: session.data.userId, tenant_id: tenant.id })
      .select("id")
      .single();
    if (lErr) throw new Error(lErr.message);

    await session.update({
      userId: owner.id,
      username: owner.username,
      role: "owner",
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      impersonation: {
        masterUserId: session.data.userId,
        masterUsername: session.data.username ?? "admin",
        logId: log.id,
      },
    });
    return { slug: tenant.slug };
  });

export const stopImpersonation = createServerFn({ method: "POST" }).handler(async () => {
  const { getSaasSession } = await import("@/lib/saas-auth.server");
  const session = await getSaasSession();
  const imp = session.data?.impersonation;
  if (!imp) throw new Error("Nenhuma sessão de impersonation ativa");
  const sb = await admin();
  await sb
    .from("impersonation_logs")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", imp.logId);
  const { data: master } = await sb
    .from("app_users")
    .select("id, username")
    .eq("id", imp.masterUserId)
    .maybeSingle();
  if (!master) {
    await session.clear();
    return { ok: true };
  }
  await session.update({
    userId: master.id,
    username: master.username,
    role: "master",
    tenantId: null,
    tenantSlug: null,
    impersonation: undefined,
  });
  return { ok: true };
});
