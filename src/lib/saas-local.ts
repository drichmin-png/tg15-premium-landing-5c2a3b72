export type LocalSaasRole = "master" | "owner" | "staff";

export type LocalTenant = {
  id: string;
  slug: string;
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

const TENANTS_KEY = "tg15-saas-local-tenants-v1";
const SESSION_KEY = "tg15-saas-local-session-v1";
const MASTER_USER = "admin";
const MASTER_PASSWORD = "34561581";
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
  return [
    {
      id: "tenant_tg15",
      slug: "tg15",
      company_name: "T.G.15",
      responsible_name: "Administrador",
      contact_email: "",
      contact_phone: "",
      plan: "owner",
      status: "active",
      order_limit: 0,
      product_limit: 0,
      user_limit: 3,
      expires_at: null,
      last_login_at: null,
      created_at: new Date().toISOString(),
      owner_username: "admin",
      owner_password: MASTER_PASSWORD,
    },
  ];
}

export function listLocalTenants(): LocalTenant[] {
  const tenants = readJson<LocalTenant[]>(TENANTS_KEY, []);
  if (tenants.length) return tenants.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const seeded = defaultTenants();
  writeJson(TENANTS_KEY, seeded);
  return seeded;
}

export function getLocalTenantBySlug(slug: string) {
  return listLocalTenants().find((tenant) => tenant.slug === slug.toLowerCase()) ?? null;
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

export function verifyLocalMasterLogin(username: string, password: string) {
  return username.trim() === MASTER_USER && password === MASTER_PASSWORD;
}

export function verifyLocalTenantLogin(slug: string, username: string, password: string) {
  const tenant = getLocalTenantBySlug(slug);
  if (!tenant) throw new Error("Operador não encontrado");
  if (tenant.status === "blocked") throw new Error("Conta bloqueada. Fale com o administrador.");
  if (tenant.status === "inactive") throw new Error("Conta inativa.");
  if (tenant.owner_username !== username.trim() || tenant.owner_password !== password) {
    throw new Error("Usuário ou senha inválidos");
  }
  setLocalTenantLastLogin(tenant.id);
  return getLocalTenantById(tenant.id)!;
}

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

export function createMasterSession(username = MASTER_USER): LocalSaasSession {
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