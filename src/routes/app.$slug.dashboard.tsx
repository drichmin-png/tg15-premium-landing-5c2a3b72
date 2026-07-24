import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  clearLocalSaasSession,
  getLocalSaasSession,
  stopLocalImpersonation,
  type LocalSaasSession,
} from "@/lib/saas-local";
import { admin } from "@/lib/admin-store";
import { Dashboard as AdminDashboard } from "@/routes/admin";

export const Route = createFileRoute("/app/$slug/dashboard")({
  head: ({ params }) => ({
    meta: [
      { title: `Painel — ${params.slug}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TenantPanel,
});

function TenantPanel() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<LocalSaasSession | null>(null);
  const [ready, setReady] = useState(false);

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
    admin.setNamespace(slug);
    admin.markAuthed();
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("tg15-active-operator-slug", slug);
    }
    setSession(current);
    setReady(true);
    return () => {
      admin.setNamespace(null);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("tg15-active-operator-slug");
      }
    };
  }, [navigate, slug]);

  if (!ready || !session) return null;

  return (
    <div className="min-h-screen bg-background">
      {session.impersonation && (
        <div className="bg-amber-500 text-slate-900 text-sm">
          <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between gap-3">
            <span>
              <strong>Modo suporte:</strong> logado como <code>/{slug}</code> por{" "}
              <strong>{session.impersonation.masterUsername}</strong>.
            </span>
            <button
              onClick={() => {
                stopLocalImpersonation();
                admin.setNamespace(null);
                navigate({ to: "/master/tenants" });
              }}
              className="rounded-md bg-slate-900 text-white text-xs px-3 py-1.5 hover:bg-slate-800"
            >
              ← Voltar ao Master
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            Operador: <strong>{session.tenant?.company_name ?? slug}</strong>{" "}
            <span className="text-slate-400">· /{slug}</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/loja/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-primary/90 text-white px-3 py-1.5 font-semibold hover:bg-primary"
            >
              Abrir minha loja →
            </a>
            <button
              onClick={async () => {
                const url = `${window.location.origin}/loja/${slug}`;
                try {
                  await navigator.clipboard.writeText(url);
                  window.alert(`Link da sua loja copiado:\n${url}`);
                } catch {
                  window.prompt("Copie o link da sua loja:", url);
                }
              }}
              className="text-slate-300 hover:text-white"
            >
              Copiar link
            </button>
            <Link to="/app/$slug/orders" params={{ slug }} className="text-slate-300 hover:text-white">
              Pedidos brutos
            </Link>
            <button
              onClick={() => {
                admin.setNamespace(null);
                clearLocalSaasSession();
                navigate({ to: "/app/$slug/login", params: { slug } });
              }}
              className="text-slate-300 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </div>


      <AdminDashboard />
    </div>
  );
}
