import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  clearLocalSaasSession,
  getLocalSaasSession,
  stopLocalImpersonation,
  type LocalSaasSession,
} from "@/lib/saas-local";
import { listLocalOrders } from "@/lib/local-db";

export const Route = createFileRoute("/app/$slug/dashboard")({
  head: ({ params }) => ({
    meta: [
      { title: `Dashboard — ${params.slug}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TenantDashboard,
});

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function TenantDashboard() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<LocalSaasSession | null>(null);

  useEffect(() => {
    const current = getLocalSaasSession();
    if (!current?.tenantSlug) {
      navigate({ to: "/app/$slug/login", params: { slug }, replace: true });
      return;
    }
    if (current.tenantSlug !== slug) {
      navigate({ to: "/app/$slug/dashboard", params: { slug: current.tenantSlug }, replace: true });
      return;
    }
    setSession(current);
  }, [navigate, slug]);

  const st = useMemo(() => {
    const orders = slug === "tg15" ? listLocalOrders() : [];
    return {
      orders: orders.length,
      pending: orders.filter((order) => order.payment_status === "pending").length,
      revenueCents: orders
        .filter((order) => order.payment_status === "paid")
        .reduce((sum, order) => sum + order.total_cents, 0),
    };
  }, [slug]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {session.impersonation && (
        <div className="bg-amber-500 text-slate-900 text-sm">
          <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between gap-3">
            <span>
              <strong>Modo suporte:</strong> logado como <code>/{slug}</code> por{" "}
              <strong>{session.impersonation.masterUsername}</strong>.
            </span>
            <button
              onClick={async () => {
                stopLocalImpersonation();
                navigate({ to: "/master/tenants" });
              }}
              className="rounded-md bg-slate-900 text-white text-xs px-3 py-1.5 hover:bg-slate-800"
            >
              ← Voltar ao Master
            </button>
          </div>
        </div>
      )}

      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-500">Operador</div>
            <h1 className="text-lg font-semibold text-slate-900">
              {session.tenant?.company_name ?? slug}
            </h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/app/$slug/dashboard" params={{ slug }} className="text-slate-900 font-medium">Dashboard</Link>
            <Link to="/app/$slug/orders" params={{ slug }} className="text-slate-500 hover:text-slate-900">Pedidos</Link>
            <button
              onClick={async () => {
                clearLocalSaasSession();
                navigate({ to: "/app/$slug/login", params: { slug } });
              }}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Pedidos" value={String(st?.orders ?? "—")} />
          <StatCard label="Pendentes" value={String(st?.pending ?? "—")} />
          <StatCard label="Receita paga" value={st ? fmtBRL(st.revenueCents) : "—"} />
        </div>

        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-base font-semibold text-slate-900">Bem-vindo, {session.username}</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Você está no painel do operador <strong>/{slug}</strong>. Nesta fase estão ativos
            dashboard e pedidos, isolados por operador. Os próximos módulos (clientes, produtos,
            cupons, landing pages editáveis, financeiro, e-mails, permissões de usuários internos)
            serão adicionados nas próximas fases mantendo o mesmo isolamento.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/app/$slug/orders"
              params={{ slug }}
              className="text-sm rounded-md bg-slate-900 text-white px-3 py-2 hover:bg-slate-800"
            >
              Ver pedidos
            </Link>
            {slug === "tg15" && (
              <Link
                to="/admin"
                className="text-sm rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-100"
              >
                Abrir painel legado do T.G.15
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
