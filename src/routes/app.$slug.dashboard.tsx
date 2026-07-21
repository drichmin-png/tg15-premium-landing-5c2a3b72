import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentSession, logout, stopImpersonation } from "@/lib/saas.functions";

export const Route = createFileRoute("/app/$slug/dashboard")({
  head: ({ params }) => ({
    meta: [
      { title: `Dashboard — ${params.slug}` },
      { name: "robots", content: "noindex" },
    ],
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
  component: TenantDashboard,
});

function TenantDashboard() {
  const { session } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const doLogout = useServerFn(logout);
  const stopImp = useServerFn(stopImpersonation);
  const navigate = useNavigate();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      {session.impersonation && (
        <div className="bg-amber-500 text-slate-900 text-sm">
          <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between gap-3">
            <span>
              <strong>Modo suporte:</strong> você entrou como <code>{slug}</code> a partir de{" "}
              <strong>{session.impersonation.masterUsername}</strong>.
            </span>
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
            <h1 className="text-lg font-semibold text-slate-900">
              {session.tenant?.company_name ?? slug}
            </h1>
          </div>
          <button
            onClick={async () => {
              await doLogout({ data: undefined });
              await router.invalidate();
              navigate({ to: "/app/$slug/login", params: { slug } });
            }}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl border p-8">
          <h2 className="text-xl font-semibold text-slate-900">Bem-vindo, {session.username}</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg">
            Este é o painel do operador <strong>/{slug}</strong>. Nesta Fase 1 apenas a base
            multi-tenant (login, sessão isolada e URL exclusiva) foi entregue. Nas próximas fases
            os módulos de pedidos, clientes, produtos, landing pages, financeiro e integrações
            serão migrados para dentro deste painel, cada um filtrado automaticamente por este
            tenant.
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase text-slate-500">Slug</dt>
              <dd className="font-mono">{slug}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Papel</dt>
              <dd className="capitalize">{session.role}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Status</dt>
              <dd className="capitalize">{session.tenant?.status ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Usuário</dt>
              <dd>{session.username}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
