import { ShieldCheck, Lock, Truck, HeartPulse } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-sand">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg gradient-brand text-white font-black text-sm">
                TG
              </span>
              <div className="text-sm font-bold tracking-tight">T.G.15</div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Tirzepatida 15mg/0,5mL. Ciência, tecnologia e resultados para uma
              transformação completa.
            </p>
          </div>

          <div>
            <div className="eyebrow mb-3">Produto</div>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li><a href="#produto" className="hover:text-primary">Sobre o T.G.15</a></li>
              <li><a href="#dosagem" className="hover:text-primary">Fracionamento</a></li>
              <li><a href="#aplicacao" className="hover:text-primary">Como usar</a></li>
              <li><a href="#faq" className="hover:text-primary">Perguntas frequentes</a></li>
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-3">Suporte</div>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li>Central de atendimento</li>
              <li>Envios e rastreio</li>
              <li>Trocas e devoluções</li>
              <li>Política de privacidade</li>
            </ul>
          </div>

          <div>
            <div className="eyebrow mb-3">Compra Protegida</div>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Ambiente 100% seguro</li>
              <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Dados criptografados</li>
              <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Envio refrigerado</li>
              <li className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-primary" /> Produto farmacêutico</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground flex flex-col md:flex-row justify-between gap-2">
          <div>© {new Date().getFullYear()} T.G.15 — Todos os direitos reservados.</div>
          <div>Venda sob prescrição médica. Uso adulto.</div>
        </div>
      </div>
    </footer>
  );
}
