export type LocalSaasRole = "master" | "owner" | "staff";

export type LocalTenant = {
  id: string;
  slug: string;
  shortcode: string;
  company_name: string;
  responsible_name: string;
  contact_email: string;
  contact_phone: string;
  plan: string;
  status: "active" | "inactive" | "blocked";
  order_limit: number;
  product_limit: number;
  user_limit: number;
  expires_at: string | null;
  last_login_at: string | null;
  created_at: string;
  owner_username: string;
  owner_password: string;
};

export type LocalSaasSession = {
  userId: string;
  username: string;
  role: LocalSaasRole;
  tenantId: string | null;
  tenantSlug: string | null;
  tenant?: { id: string; slug: string; company_name: string; status: string } | null;
  impersonation?: {
    masterUserId: string;
    masterUsername: string;
    logId: string;
  } | null;
};

export type CreateLocalTenantPayload = {
  slug: string;
  company_name: string;
  responsible_name: string;
  contact_email: string;
  contact_phone: string;
  plan: string;
  owner_username: string;
  owner_password: string;
};

export type LocalTenantAccessPayload = {
  slug: string;
  company_name: string;
  owner_username: string;
  owner_password: string;
  plan?: string;
};

const TENANTS_KEY = "tg15-saas-local-tenants-v1";
const SESSION_KEY = "tg15-saas-local-session-v1";
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

function normalizeText(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugifyTenantName(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function encodeAccessPayload(payload: LocalTenantAccessPayload) {
  try {
    const json = JSON.stringify(payload);
    if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return "";
  }
  return "";
}

function decodeAccessPayload(token: string): LocalTenantAccessPayload | null {
  try {
    if (typeof atob !== "function") return null;
    const parsed = JSON.parse(decodeURIComponent(escape(atob(token)))) as Partial<LocalTenantAccessPayload>;
    if (!parsed.slug || !parsed.company_name || !parsed.owner_username || !parsed.owner_password) return null;
    return {
      slug: parsed.slug,
      company_name: parsed.company_name,
      owner_username: parsed.owner_username,
      owner_password: parsed.owner_password,
      plan: parsed.plan,
    };
  } catch {
    return null;
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function makeShortcode() {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buf = new Uint8Array(3);
    crypto.getRandomValues(buf);
    return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(16).slice(2, 8).padEnd(6, "0");
}

function ensureShortcode(tenants: LocalTenant[], existing?: string) {
  if (existing && /^[a-z0-9]{4,10}$/.test(existing)) return existing;
  const used = new Set(tenants.map((t) => t.shortcode).filter(Boolean));
  for (let i = 0; i < 20; i++) {
    const code = makeShortcode();
    if (!used.has(code)) return code;
  }
  return makeShortcode();
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function defaultTenants(): LocalTenant[] {
  // Master is not a tenant. Operators are created via the Master panel.
  return [];
}

export function listLocalTenants(): LocalTenant[] {
  const raw = readJson<LocalTenant[]>(TENANTS_KEY, []);
  if (!raw.length) {
    const seeded = defaultTenants();
    writeJson(TENANTS_KEY, seeded);
    return seeded;
  }
  // Backfill shortcode for legacy tenants persisted before the field existed.
  let mutated = false;
  const used = new Set<string>();
  const withCodes = raw.map((t) => {
    if (t.shortcode && !used.has(t.shortcode)) {
      used.add(t.shortcode);
      return t;
    }
    mutated = true;
    const code = ensureShortcode(raw.filter((x) => x.shortcode && !used.has(x.shortcode)));
    used.add(code);
    return { ...t, shortcode: code };
  });
  if (mutated) writeJson(TENANTS_KEY, withCodes);
  return withCodes.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export function getLocalTenantBySlug(slug: string) {
  return listLocalTenants().find((tenant) => tenant.slug === slug.trim().toLowerCase()) ?? null;
}

export function getLocalTenantByShortcode(code: string) {
  const c = code.trim().toLowerCase();
  return listLocalTenants().find((tenant) => tenant.shortcode === c) ?? null;
}

export function getLocalTenantById(id: string) {
  return listLocalTenants().find((tenant) => tenant.id === id) ?? null;
}

export function createLocalTenant(payload: CreateLocalTenantPayload) {
  const slug = payload.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) throw new Error("Slug inválido. Use letras minúsculas, números e hífen.");
  if (!payload.company_name.trim()) throw new Error("Nome da empresa é obrigatório");
  if (!payload.owner_username.trim()) throw new Error("Usuário do dono é obrigatório");
  if (!payload.owner_password || payload.owner_password.length < 4) throw new Error("Senha do dono muito curta");

  const tenants = listLocalTenants();
  if (tenants.some((tenant) => tenant.slug === slug)) throw new Error("Já existe um operador com esse slug");

  const tenant: LocalTenant = {
    id: makeId("tenant"),
    slug,
    shortcode: ensureShortcode(tenants),
    company_name: payload.company_name.trim(),
    responsible_name: payload.responsible_name.trim(),
    contact_email: payload.contact_email.trim(),
    contact_phone: payload.contact_phone.trim(),
    plan: payload.plan || "starter",
    status: "active",
    order_limit: 0,
    product_limit: 0,
    user_limit: 3,
    expires_at: null,
    last_login_at: null,
    created_at: new Date().toISOString(),
    owner_username: payload.owner_username.trim(),
    owner_password: payload.owner_password,
  };
  writeJson(TENANTS_KEY, [tenant, ...tenants]);
  return tenant;
}

export function buildLocalTenantShortUrl(tenant: Pick<LocalTenant, "shortcode" | "slug">, origin: string) {
  // Use slug so the link resolves on any device via the server-hydrated storefront.
  // The shortcode-based `/{code}` route only works on the master's device (local map).
  return `${origin}/loja/${tenant.slug}`;
}

export function buildLocalTenantAccessUrl(payload: LocalTenantAccessPayload, origin: string) {
  const baseUrl = `${origin}/app/${payload.slug}/login`;
  const token = encodeAccessPayload(payload);
  return token ? `${baseUrl}?setup=${encodeURIComponent(token)}` : baseUrl;
}

export function importLocalTenantFromAccessToken(token: string) {
  const payload = decodeAccessPayload(token);
  if (!payload) return null;

  const slug = payload.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) return null;
  if (!payload.owner_password || payload.owner_password.length < 4) return null;

  const tenants = listLocalTenants();
  const existing = tenants.find((tenant) => tenant.slug === slug);
  const tenant: LocalTenant = {
    ...(existing ?? {
      id: makeId("tenant"),
      slug,
      shortcode: ensureShortcode(tenants),
      responsible_name: "",
      contact_email: "",
      contact_phone: "",
      status: "active" as const,
      order_limit: 0,
      product_limit: 0,
      user_limit: 3,
      expires_at: null,
      last_login_at: null,
      created_at: new Date().toISOString(),
    }),
    slug,
    company_name: payload.company_name.trim(),
    plan: payload.plan || existing?.plan || "starter",
    owner_username: payload.owner_username.trim(),
    owner_password: payload.owner_password,
  };

  writeJson(TENANTS_KEY, existing ? tenants.map((item) => (item.id === tenant.id ? tenant : item)) : [tenant, ...tenants]);
  return tenant;
}

export function setLocalTenantStatus(id: string, status: LocalTenant["status"]) {
  writeJson(
    TENANTS_KEY,
    listLocalTenants().map((tenant) => (tenant.id === id ? { ...tenant, status } : tenant)),
  );
}

export function deleteLocalTenant(id: string) {
  writeJson(
    TENANTS_KEY,
    listLocalTenants().filter((tenant) => tenant.id !== id),
  );
}

export function resetLocalTenantPassword(id: string, password: string) {
  if (!password || password.length < 4) throw new Error("Senha muito curta");
  writeJson(
    TENANTS_KEY,
    listLocalTenants().map((tenant) => (tenant.id === id ? { ...tenant, owner_password: password } : tenant)),
  );
}

// NOTE: Client-side password verification was removed. Master and tenant logins
// now go through the server functions in `saas.functions.ts`, which check bcrypt
// hashes stored in the `app_users` table. The helpers below only manage the
// browser-side session shell that other pages read for UI gating.

export function getLocalSaasSession(): LocalSaasSession | null {
  const session = readJson<LocalSaasSession | null>(SESSION_KEY, null);
  if (!session?.userId) return null;
  if (!session.tenantId) return session;
  const tenant = getLocalTenantById(session.tenantId);
  return {
    ...session,
    tenant: tenant ? { id: tenant.id, slug: tenant.slug, company_name: tenant.company_name, status: tenant.status } : null,
  };
}

export function setLocalSaasSession(session: LocalSaasSession) {
  writeJson(SESSION_KEY, session);
}

export function clearLocalSaasSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function createMasterSession(username = "admin"): LocalSaasSession {
  const session: LocalSaasSession = {
    userId: "master_local",
    username,
    role: "master",
    tenantId: null,
    tenantSlug: null,
    tenant: null,
    impersonation: null,
  };
  setLocalSaasSession(session);
  return session;
}

export function createTenantSession(tenant: LocalTenant, username: string, impersonation?: LocalSaasSession["impersonation"]) {
  const session: LocalSaasSession = {
    userId: `owner_${tenant.id}`,
    username,
    role: "owner",
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenant: { id: tenant.id, slug: tenant.slug, company_name: tenant.company_name, status: tenant.status },
    impersonation: impersonation ?? null,
  };
  setLocalSaasSession(session);
  return session;
}

export function impersonateLocalTenant(tenantId: string) {
  const master = getLocalSaasSession();
  if (!master || master.role !== "master") throw new Error("Acesso negado");
  const tenant = getLocalTenantById(tenantId);
  if (!tenant) throw new Error("Operador não encontrado");
  createTenantSession(tenant, tenant.owner_username, {
    masterUserId: master.userId,
    masterUsername: master.username,
    logId: makeId("imp"),
  });
  return { slug: tenant.slug };
}

export function stopLocalImpersonation() {
  const session = getLocalSaasSession();
  if (!session?.impersonation) return;
  createMasterSession(session.impersonation.masterUsername);
}

function setLocalTenantLastLogin(id: string) {
  writeJson(
    TENANTS_KEY,
    listLocalTenants().map((tenant) =>
      tenant.id === id ? { ...tenant, last_login_at: new Date().toISOString() } : tenant,
    ),
  );
}