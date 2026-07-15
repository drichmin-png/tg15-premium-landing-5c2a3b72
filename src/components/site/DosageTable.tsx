import { useState } from "react";
import { Info, Maximize2, X } from "lucide-react";
import { media } from "@/lib/product";

const rows = [
  { mg: "2,5mg", weeks: "6 semanas", applications: "6 aplicações", ui: "8,3 UI" },
  { mg: "5mg", weeks: "3 semanas", applications: "3 aplicações", ui: "17 UI" },
  { mg: "7,5mg", weeks: "2 semanas", applications: "2 aplicações", ui: "25 UI" },
  { mg: "10mg", weeks: "1 semana", applications: "1 aplicação", ui: "33 UI" },
  { mg: "12,5mg", weeks: "1 semana", applications: "1 aplicação", ui: "42 UI" },
  { mg: "15mg", weeks: "1 semana", applications: "1 aplicação", ui: "50 UI" },
];

export function DosageTable() {
  const [zoom, setZoom] = useState(false);
  return (
    <section id="dosagem" className="container-x mt-24">
      <div className="max-w-2xl">
        <div className="eyebrow">Tabela de Fracionamento</div>
        <h2 className="heading-display mt-3 text-4xl md:text-5xl text-ink">
          Dosagem <span className="text-gradient-brand">precisa</span>, sem margem para erro
        </h2>
        <p className="mt-3 text-muted-foreground">
          Referência oficial para fracionamento do T.G.15 15mg/0,5mL. Considera aplicação de 1 dose por semana.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="card-premium overflow-hidden">
          <div className="gradient-brand px-6 py-5 text-white">
            <div className="grid grid-cols-3 gap-4 text-xs uppercase tracking-wider font-bold">
              <div>Quantidade (mg)</div>
              <div>Nº de semanas (aplicações)</div>
              <div>Medida na Seringa</div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {rows.map((r, i) => (
              <div
                key={r.mg}
                className={`grid grid-cols-3 items-center gap-4 px-6 py-4 ${i % 2 ? "bg-sand/60" : "bg-card"}`}
              >
                <div className="text-2xl font-bold text-gradient-brand">{r.mg}</div>
                <div>
                  <div className="text-lg font-semibold text-ink">{r.weeks}</div>
                  <div className="text-xs text-muted-foreground">({r.applications})</div>
                </div>
                <div className="text-2xl font-bold text-ink">{r.ui}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-6 py-4 border-t border-border bg-sand/60 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 text-primary" />
            *Cálculo baseado em 1 dose por semana. Consulte seu médico.
          </div>
        </div>

        <div className="relative card-premium overflow-hidden">
          <button
            onClick={() => setZoom(true)}
            className="group relative block h-full w-full"
            aria-label="Ampliar tabela oficial"
          >
            <img
              src={media.tabela}
              alt="Tabela de fracionamento oficial T.G.15"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
            <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-ink shadow">
              <Maximize2 className="h-3.5 w-3.5" /> Ampliar tabela oficial
            </span>
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
        <div className="grid h-10 w-10 place-items-center rounded-full gradient-brand text-white shrink-0">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold text-ink">Sempre use essa referência para não errar a dose.</div>
          <div className="text-sm text-muted-foreground">
            Guarde este material para consulta durante todo o tratamento.
          </div>
        </div>
      </div>

      {zoom && (
        <div
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-[100] grid place-items-center bg-ink/80 backdrop-blur-sm p-4"
        >
          <button
            className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={media.tabela}
            alt="Tabela ampliada"
            className="max-h-[90vh] max-w-[95vw] rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
