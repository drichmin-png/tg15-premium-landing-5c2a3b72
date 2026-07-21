import { createServerFn } from "@tanstack/react-start";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function requireSession() {
  const { getSaasSession } = await import("@/lib/saas-auth.server");
  const session = await getSaasSession();
  if (!session.data?.userId) throw new Error("Não autenticado");
  return session.data;
}

async function requireMaster() {
  const s = await requireSession();
  if (s.role !== "master" && !s.impersonation) throw new Error("Acesso negado");
  return s;
}

async function requireTenant(slug: string) {
  const s = await requireSession();
  if (s.role === "master" && !s.impersonation) throw new Error("Acesso negado");
  if (s.tenantSlug !== slug) throw new Error("Acesso negado a este operador");
  return s;
}

export type OrderRow = {
  id: string;
  public_token: string;
  created_at: string;
  paid_at: string | null;
  payment_method: string;
  payment_status: string;
  total_cents: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  tenant_id: string | null;
  tenant_slug?: string;
  tenant_name?: string;
};

// -------- master global view --------

export const listAllOrders = createServerFn({ method: "GET" }).handler(async () => {
  await requireMaster();
  const sb = await admin();
  const { data: orders, error } = await sb
    .from("orders")
    .select(
      "id, public_token, created_at, paid_at, payment_method, payment_status, total_cents, customer_name, customer_email, customer_phone, tenant_id",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  const { data: tenants } = await sb.from("tenants").select("id, slug, company_name");
  const byId = new Map((tenants ?? []).map((t) => [t.id, t]));
  return (orders ?? []).map((o) => ({
    ...o,
    tenant_slug: o.tenant_id ? byId.get(o.tenant_id)?.slug : undefined,
    tenant_name: o.tenant_id ? byId.get(o.tenant_id)?.company_name : undefined,
  })) as OrderRow[];
});

export const globalStats = createServerFn({ method: "GET" }).handler(async () => {
  await requireMaster();
  const sb = await admin();
  const [{ count: tenantCount }, { count: orderCount }, { data: revenueRows }] = await Promise.all([
    sb.from("tenants").select("*", { count: "exact", head: true }),
    sb.from("orders").select("*", { count: "exact", head: true }),
    sb.from("orders").select("total_cents").eq("payment_status", "paid"),
  ]);
  const revenueCents = (revenueRows ?? []).reduce((s, r) => s + (r.total_cents ?? 0), 0);
  return {
    tenants: tenantCount ?? 0,
    orders: orderCount ?? 0,
    revenueCents,
  };
});

// -------- tenant view --------

export const listTenantOrders = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const s = await requireTenant(data.slug);
    const sb = await admin();
    const { data: orders, error } = await sb
      .from("orders")
      .select(
        "id, public_token, created_at, paid_at, payment_method, payment_status, total_cents, customer_name, customer_email, customer_phone, tenant_id",
      )
      .eq("tenant_id", s.tenantId!)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (orders ?? []) as OrderRow[];
  });

export const tenantStats = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const s = await requireTenant(data.slug);
    const sb = await admin();
    const [{ count: orderCount }, { data: paidRows }, { count: pendingCount }] = await Promise.all([
      sb.from("orders").select("*", { count: "exact", head: true }).eq("tenant_id", s.tenantId!),
      sb.from("orders").select("total_cents").eq("tenant_id", s.tenantId!).eq("payment_status", "paid"),
      sb
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", s.tenantId!)
        .eq("payment_status", "pending"),
    ]);
    const revenueCents = (paidRows ?? []).reduce((sum, r) => sum + (r.total_cents ?? 0), 0);
    return {
      orders: orderCount ?? 0,
      pending: pendingCount ?? 0,
      revenueCents,
    };
  });
