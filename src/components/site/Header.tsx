import { Link } from "@tanstack/react-router";
import { ShieldCheck, ShoppingBag } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-white font-black text-sm shadow-md shadow-primary/30">
            TG
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-tight text-ink">T.G.15</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Site Oficial
            </div>
          </div>
        </Link>

        <nav className="hidden gap-8 md:flex">
          {[
            ["Produto", "#produto"],
            ["Benefícios", "#beneficios"],
            ["Dosagem", "#dosagem"],
            ["Aplicação", "#aplicacao"],
            ["Resultados", "#resultados"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-[11px] font-medium text-muted-foreground lg:flex">
            <ShieldCheck className="h-4 w-4 text-primary" /> Compra Segura
          </span>
          <a
            href="#comprar"
            className="inline-flex items-center gap-2 rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-transform hover:scale-[1.02]"
          >
            <ShoppingBag className="h-4 w-4" />
            Comprar
          </a>
        </div>
      </div>
    </header>
  );
}
