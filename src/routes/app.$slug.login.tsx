import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  createTenantSession,
  getLocalTenantBySlug,
  importLocalTenantFromAccessToken,
} from "@/lib/saas-local";
import { tenantLogin } from "@/lib/saas.functions";

export const Route = createFileRoute("/app/$slug/login")({
  head: ({ params }) => ({
    meta: [
      { title: `Entrar — ${params.slug}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TenantLoginPage,
});

function TenantLoginPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const setupToken = new URLSearchParams(window.location.search).get("setup");
    if (!setupToken) return;
    const tenant = importLocalTenantFromAccessToken(setupToken);
    if (tenant) setUsername(tenant.owner_username);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          try {
            const trimmedUser = username.trim();
            // Server verifies the credentials against the bcrypt hash stored in `app_users`.
            await tenantLogin({ data: { slug, username: trimmedUser, password } });
            // Populate the local session shell so client-side UI gates work.
            const tenant = getLocalTenantBySlug(slug);
            if (tenant) {
              createTenantSession(tenant, trimmedUser);
            } else {
              // Fallback minimal session; server cookie is the source of truth.
              createTenantSession(
                {
                  id: slug,
                  slug,
                  company_name: slug,
                  responsible_name: "",
                  contact_email: "",
                  contact_phone: "",
                  plan: "starter",
                  status: "active",
                  order_limit: 0,
                  product_limit: 0,
                  user_limit: 3,
                  expires_at: null,
                  last_login_at: null,
                  created_at: new Date().toISOString(),
                  owner_username: trimmedUser,
                  owner_password: "",
                },
                trimmedUser,
              );
            }
            navigate({ to: "/app/$slug/dashboard", params: { slug } });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao entrar");
          } finally {
            setLoading(false);
          }
        }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-5"
      >
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-slate-500">Operador</div>
          <h1 className="text-2xl font-bold mt-1 text-slate-900">/{slug}</h1>
          <p className="text-xs text-slate-500 mt-1">Entre com seu usuário e senha</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Usuário</label>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 text-white py-2.5 font-medium hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <div className="text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-700">← Voltar ao site</Link>
        </div>
      </form>
    </div>
  );
}
