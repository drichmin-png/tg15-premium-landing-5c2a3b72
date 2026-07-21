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
  owner_username: string;
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
                  {filtered.map((t: Tenant) => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "";
                    const accessUrl = `${origin}/app/${t.slug}/login`;
                    const shareText = `Seu painel de operador está pronto ✅\n\nAcesso: ${accessUrl}\nUsuário: ${t.owner_username}`;
                    return (
                    <tr key={t.id} className="hover:bg-slate-50 align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{t.company_name}</div>
                        <div className="text-xs text-slate-500">{t.responsible_name || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-slate-700 mb-1">/app/{t.slug}</div>
                        <div className="flex items-center gap-1">
                          <input
                            readOnly
                            value={accessUrl}
                            onFocus={(e) => e.currentTarget.select()}
                            className="w-full min-w-[180px] max-w-[240px] rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-700"
                          />
                          <button
                            onClick={async () => {
                              try { await navigator.clipboard.writeText(accessUrl); window.alert("Link copiado!"); } catch {/* */}
                            }}
                            title="Copiar link"
                            className="text-[11px] rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-100"
                          >
                            Copiar
                          </button>
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Enviar por WhatsApp"
                            className="text-[11px] rounded-md bg-emerald-600 text-white px-2 py-1 hover:bg-emerald-700"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </td>
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
                  );})}
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
            const t = createLocalTenant(payload);
            refresh();
            return { slug: t.slug, username: t.owner_username, password: payload.owner_password };
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
  }) => Promise<{ slug: string; username: string; password: string }>;
}) {
  const [form, setForm] = useState({
    name: "",
    role: "operador" as "admin" | "operador",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ slug: string; username: string; password: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || `op-${Date.now().toString(36)}`;

  if (created) {
    const shareText = `Seu painel de operador está pronto ✅\n\nAcesso: ${created.url}\nUsuário: ${created.username}\nSenha: ${created.password}`;
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-emerald-600 font-semibold">Operador criado</div>
            <h2 className="text-lg font-semibold text-slate-900 mt-1">Compartilhe o acesso</h2>
            <p className="text-xs text-slate-500 mt-1">Envie o link e as credenciais abaixo para o operador.</p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-600">Link de acesso</div>
            <div className="flex gap-2">
              <input readOnly value={created.url} onFocus={(e) => e.currentTarget.select()} className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs" />
              <button
                onClick={async () => {
                  try { await navigator.clipboard.writeText(created.url); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {/* */}
                }}
                className="text-xs rounded-lg bg-slate-900 text-white px-3 py-2 hover:bg-slate-800"
              >
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Usuário</div>
              <div className="text-sm font-mono text-slate-900">{created.username}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Senha</div>
              <div className="text-sm font-mono text-slate-900">{created.password}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs rounded-lg bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700"
            >
              Enviar por WhatsApp
            </a>
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {/* */}
              }}
              className="text-xs rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-100"
            >
              Copiar credenciais
            </button>
            <button
              onClick={onClose}
              className="ml-auto text-xs rounded-lg bg-slate-900 text-white px-3 py-2 hover:bg-slate-800"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (!form.name.trim()) return setError("Informe o nome");
          if (!form.password || form.password.length < 4) return setError("Senha muito curta");
          setLoading(true);
          try {
            const slug = slugify(form.name);
            const res = await onCreate({
              slug,
              company_name: form.name.trim(),
              responsible_name: "",
              contact_email: "",
              contact_phone: "",
              plan: form.role === "admin" ? "owner" : "starter",
              owner_username: form.role === "admin" ? "admin" : "operador",
              owner_password: form.password,
            });
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            setCreated({
              slug: res.slug,
              username: res.username,
              password: res.password,
              url: `${origin}/app/${res.slug}/login`,
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Erro");
          } finally {
            setLoading(false);
          }
        }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Novo operador</h2>
          <p className="text-xs text-slate-500">Cria um painel de acesso particular para este operador.</p>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Ex.: João Silva"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Tipo de acesso *</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "admin" | "operador" }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
            >
              <option value="operador">Operador</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Senha de acesso *</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Mínimo 4 caracteres"
            />
          </div>
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

