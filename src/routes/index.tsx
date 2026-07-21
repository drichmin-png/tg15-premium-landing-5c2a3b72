import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "T.G.15 — Plataforma de Operadores" },
      { name: "description", content: "Plataforma multi-operador T.G.15. Cada operador possui um link exclusivo de loja." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Plataforma T.G.15</div>
        <h1 className="text-3xl sm:text-4xl font-bold">Sistema de Operadores</h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          Esta é uma plataforma multi-operador. Cada operador possui um link exclusivo de loja
          no formato <code className="text-white font-mono">/loja/&lt;nome&gt;</code>. Peça o link ao seu operador
          para comprar.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/master/login"
            className="w-full sm:w-auto rounded-lg bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold hover:bg-slate-100"
          >
            Entrar como Master
          </Link>
        </div>
        <div className="text-[11px] text-slate-500 pt-6">
          É operador? Acesse o link exclusivo enviado pelo Master.
        </div>
      </div>
    </div>
  );
}
