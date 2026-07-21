import { createFileRoute, redirect, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getCurrentSession, logout, stopImpersonation } from "@/lib/saas.functions";
import { listTenantOrders, type OrderRow } from "@/lib/saas-data.functions";

export const Route = createFileRoute("/app/$slug/orders")({
  head: ({ params }) => ({
    meta: [{ title: `Pedidos — ${params.slug}` }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async ({ params }) => {
    const s = await getCurrentSession();
    if (!s || !s.tenantSlug) throw redirect({ to: "/app/$slug/login", params: { slug: params.slug } });
    if (s.tenantSlug !== params.slug)
      throw redirect({ to: "/app/$slug/dashboard", params: { slug: s.tenantSlug } });
    return { session: s };
  },
  loader: async () => {
    const s = await getCurrentSession();
    return { session: s! };
  },
  component: TenantOrdersPage,
});

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function TenantOrdersPage() {
  const { session } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const list = useServerFn(listTenantOrders);
  const doLogout = useServerFn(logout);
  const stopImp = useServerFn(stopImpersonation);
  const navigate = useNavigate();
  const router = useRouter();

  const { data: orders } = useQuery({
    queryKey: ["tenant", slug, "orders"],
    queryFn: () => list({ data: { slug } }),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {session.impersonation && (
        <div className="bg-amber-500 text-slate-900 text-sm">
          <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between gap-3">
            <span>Modo suporte como <strong>/{slug}</strong></span>
            <button
              onClick={async () => {
                await stopImp({ data: undefined });
                await router.invalidate();
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
            <h1 className="text-lg font-semibold text-slate-900">{session.tenant?.company_name ?? slug}</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/app/$slug/dashboard" params={{ slug }} className="text-slate-500 hover:text-slate-900">Dashboard</Link>
            <Link to="/app/$slug/orders" params={{ slug }} className="text-slate-900 font-medium">Pedidos</Link>
            <button
              onClick={async () => {
                await doLogout({ data: undefined });
                await router.invalidate();
                navigate({ to: "/app/$slug/login", params: { slug } });
              }}
              className="text-slate-500 hover:text-slate-900"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Método</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(orders ?? []).map((o: OrderRow) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.customer_name}</div>
                      <div className="text-xs text-slate-500">{o.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{o.payment_method}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                          (o.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : o.payment_status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700")
                        }
                      >
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{fmtBRL(o.total_cents)}</td>
                  </tr>
                ))}
                {!(orders ?? []).length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                      Nenhum pedido deste operador ainda.
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
