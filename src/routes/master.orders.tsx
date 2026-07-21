import { createFileRoute, redirect, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getCurrentSession, logout } from "@/lib/saas.functions";
import { listAllOrders, globalStats, type OrderRow } from "@/lib/saas-data.functions";
import { useState } from "react";

export const Route = createFileRoute("/master/orders")({
  head: () => ({ meta: [{ title: "Pedidos globais — Master" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const s = await getCurrentSession();
    if (!s || s.role !== "master") throw redirect({ to: "/master/login" });
  },
  component: MasterOrdersPage,
});

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function MasterOrdersPage() {
  const list = useServerFn(listAllOrders);
  const stats = useServerFn(globalStats);
  const doLogout = useServerFn(logout);
  const navigate = useNavigate();
  const router = useRouter();

  const [tenantFilter, setTenantFilter] = useState<string>("");

  const { data: orders } = useQuery({ queryKey: ["master", "orders"], queryFn: () => list() });
  const { data: st } = useQuery({ queryKey: ["master", "stats"], queryFn: () => stats() });

  const filtered = (orders ?? []).filter((o: OrderRow) => !tenantFilter || o.tenant_slug === tenantFilter);
  const slugs = Array.from(new Set((orders ?? []).map((o: OrderRow) => o.tenant_slug).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-400">SaaS · Master</div>
            <h1 className="text-lg font-semibold">Visão global</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/master/tenants" className="text-slate-300 hover:text-white">Operadores</Link>
            <Link to="/master/orders" className="text-white font-medium">Pedidos</Link>
            <button
              onClick={async () => {
                await doLogout({ data: undefined });
                await router.invalidate();
                navigate({ to: "/master/login" });
              }}
              className="text-slate-300 hover:text-white"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Operadores" value={String(st?.tenants ?? "—")} />
          <Stat label="Pedidos" value={String(st?.orders ?? "—")} />
          <Stat label="Receita paga" value={st ? fmtBRL(st.revenueCents) : "—"} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 bg-white text-sm"
          >
            <option value="">Todos os operadores</option>
            {slugs.map((s) => (
              <option key={s} value={s}>/{s}</option>
            ))}
          </select>
          <div className="text-xs text-slate-500">{filtered.length} pedido(s)</div>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Operador</th>
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Método</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o: OrderRow) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.tenant_name ?? "—"}</div>
                      <div className="text-xs text-slate-500 font-mono">/{o.tenant_slug ?? "?"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.customer_name}</div>
                      <div className="text-xs text-slate-500">{o.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{o.payment_method}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={o.payment_status} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{fmtBRL(o.total_cents)}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "paid"
      ? "bg-green-100 text-green-800"
      : status === "pending"
        ? "bg-amber-100 text-amber-800"
        : status === "canceled" || status === "refunded"
          ? "bg-red-100 text-red-800"
          : "bg-slate-200 text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
