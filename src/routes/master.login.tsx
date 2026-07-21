import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { createMasterSession, verifyLocalMasterLogin } from "@/lib/saas-local";

export const Route = createFileRoute("/master/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Admin Master" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MasterLoginPage,
});

function MasterLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          try {
            if (!verifyLocalMasterLogin(username, password)) throw new Error("Usuário ou senha inválidos");
            createMasterSession(username.trim() || "admin");
            navigate({ to: "/master/tenants" });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao entrar");
          } finally {
            setLoading(false);
          }
        }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-5"
      >
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-slate-500">SaaS · Admin Master</div>
          <h1 className="text-2xl font-bold mt-1 text-slate-900">Entrar como Master</h1>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Usuário</label>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="admin"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="••••••••"
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
