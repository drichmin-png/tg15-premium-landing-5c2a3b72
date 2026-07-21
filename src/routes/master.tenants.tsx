import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  clearLocalSaasSession,
  createLocalTenant,
  deleteLocalTenant,
  getLocalSaasSession,
  impersonateLocalTenant,
  listLocalTenants,
  resetLocalTenantPassword,
  setLocalTenantStatus,
} from "@/lib/saas-local";

type Tenant = {
  id: string;
  slug: string;
  company_name: string;
  responsible_name: string;
  contact_email: string;
  contact_phone: string;
  plan: string;
  status: string;
  order_limit: number;
  product_limit: number;
  user_limit: number;
  expires_at: string | null;
  last_login_at: string | null;
  created_at: string;
};

export const Route = createFileRoute("/master/tenants")({
  head: () => ({ meta: [{ title: "Operadores — Admin Master" }, { name: "robots", content: "noindex" }] }),
  component: TenantsPage,
});

function TenantsPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const refresh = () => setTenants(listLocalTenants());

  useEffect(() => {
    const session = getLocalSaasSession();
    if (!session || session.role !== "master") {
      navigate({ to: "/master/login", replace: true });
      return;
    }
    refresh();
    setIsLoading(false);
  }, [navigate]);

  const filtered = tenants.filter((t: Tenant) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return t.slug.includes(s) || t.company_name.toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-slate-400">SaaS · Master</div>
            <h1 className="text-lg font-semibold">Operadores</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/master/tenants" className="text-white font-medium">Operadores</Link>
            <Link to="/master/orders" className="text-slate-300 hover:text-white">Pedidos</Link>
            <button
              onClick={async () => {
                clearLocalSaasSession();
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
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou slug..."
            className="flex-1 min-w-[220px] rounded-lg border border-slate-300 px-3 py-2 bg-white"
          />
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
          >
            + Novo operador
          </button>
        </div>

        {isLoading ? (
          <div className="text-sm text-slate-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-500 bg-white rounded-lg border p-8 text-center">
            Nenhum operador encontrado.
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Empresa</th>
                    <th className="text-left px-4 py-3">Slug</th>
                    <th className="text-left px-4 py-3">Plano</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Último login</th>
                    <th className="text-right px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((t: Tenant) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{t.company_name}</div>
                        <div className="text-xs text-slate-500">{t.responsible_name || "—"}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">/app/{t.slug}</td>
                      <td className="px-4 py-3 capitalize">{t.plan}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                            (t.status === "active"
                              ? "bg-green-100 text-green-800"
                              : t.status === "blocked"
                                ? "bg-red-100 text-red-800"
                                : "bg-slate-200 text-slate-700")
                          }
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {t.last_login_at ? new Date(t.last_login_at).toLocaleString("pt-BR") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <button
                            onClick={async () => {
                              const r = impersonateLocalTenant(t.id);
                              navigate({ to: "/app/$slug/dashboard", params: { slug: r.slug } });
                            }}
                            className="text-xs rounded-md bg-slate-900 text-white px-2.5 py-1 hover:bg-slate-800"
                          >
                            Entrar
                          </button>
                          <button
                            onClick={async () => {
                              const pwd = window.prompt("Nova senha do dono:");
                              if (!pwd) return;
                              try {
                                resetLocalTenantPassword(t.id, pwd);
                                window.alert("Senha atualizada.");
                                refresh();
                              } catch (e) {
                                window.alert(e instanceof Error ? e.message : "Erro");
                              }
                            }}
                            className="text-xs rounded-md border border-slate-300 px-2.5 py-1 hover:bg-slate-100"
                          >
                            Reset senha
                          </button>
                          <button
                            onClick={async () => {
                              const next = t.status === "blocked" ? "active" : "blocked";
                              setLocalTenantStatus(t.id, next);
                              refresh();
                            }}
                            className="text-xs rounded-md border border-slate-300 px-2.5 py-1 hover:bg-slate-100"
                          >
                            {t.status === "blocked" ? "Liberar" : "Bloquear"}
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Excluir ${t.company_name}? Todos os dados serão removidos.`)) return;
                              deleteLocalTenant(t.id);
                              refresh();
                            }}
                            className="text-xs rounded-md border border-red-200 text-red-700 px-2.5 py-1 hover:bg-red-50"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500">
          <Link to="/admin" className="underline">Painel legado do T.G.15</Link>
        </div>
      </main>

      {showCreate && (
        <CreateTenantModal
          onClose={() => setShowCreate(false)}
          onCreate={async (payload) => {
            createLocalTenant(payload);
            refresh();
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function CreateTenantModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: {
    slug: string;
    company_name: string;
    responsible_name: string;
    contact_email: string;
    contact_phone: string;
    plan: string;
    owner_username: string;
    owner_password: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    slug: "",
    company_name: "",
    responsible_name: "",
    contact_email: "",
    contact_phone: "",
    plan: "starter",
    owner_username: "admin",
    owner_password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          try {
            await onCreate(form);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Erro");
          } finally {
            setLoading(false);
          }
        }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Novo operador</h2>
          <p className="text-xs text-slate-500">Cria o tenant e o usuário dono para acessar em /app/&lt;slug&gt;.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nome da empresa *" v={form.company_name} onChange={set("company_name")} />
          <Field label="Slug (URL) *" v={form.slug} onChange={set("slug")} placeholder="empresa01" />
          <Field label="Responsável" v={form.responsible_name} onChange={set("responsible_name")} />
          <Field label="E-mail" v={form.contact_email} onChange={set("contact_email")} type="email" />
          <Field label="Telefone" v={form.contact_phone} onChange={set("contact_phone")} />
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Plano</label>
            <select value={form.plan} onChange={set("plan")} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white">
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <Field label="Usuário do dono *" v={form.owner_username} onChange={set("owner_username")} />
          <Field label="Senha do dono *" v={form.owner_password} onChange={set("owner_password")} type="password" />
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="text-sm px-3 py-2 rounded-md border border-slate-300 hover:bg-slate-100">Cancelar</button>
          <button type="submit" disabled={loading} className="text-sm px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60">
            {loading ? "Criando..." : "Criar operador"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  v,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  v: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        value={v}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </div>
  );
}
