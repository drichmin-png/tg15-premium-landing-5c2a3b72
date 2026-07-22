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

type ZoomTarget = "custom" | "official" | null;

function CustomTable({ compact = false }: { compact?: boolean }) {
  return (
    <div className="card-premium overflow-hidden h-full flex flex-col">
      <div className={`gradient-brand text-white ${compact ? "px-2 py-2 md:px-6 md:py-5" : "px-3 py-3 md:px-6 md:py-5"}`}>
        <div className={`grid grid-cols-3 gap-1 md:gap-4 font-bold uppercase tracking-wider ${compact ? "text-[7px] md:text-xs" : "text-xs"}`}>
          <div>Qtd</div>
          <div>Semanas</div>
          <div>Seringa</div>
        </div>
      </div>
      <div className="divide-y divide-border flex-1">
        {rows.map((r, i) => (
          <div
            key={r.mg}
            className={`grid grid-cols-3 items-center gap-1 md:gap-4 ${compact ? "px-2 py-1.5 md:px-6 md:py-4" : "px-3 py-2 md:px-6 md:py-4"} ${i % 2 ? "bg-sand/60" : "bg-card"}`}
          >
            <div className={`font-bold text-gradient-brand leading-tight ${compact ? "text-[11px] md:text-2xl" : "text-2xl"}`}>{r.mg}</div>
            <div className="min-w-0">
              <div className={`font-semibold text-ink leading-tight ${compact ? "text-[10px] md:text-lg" : "text-lg"}`}>{r.weeks}</div>
              <div className={`text-muted-foreground leading-tight ${compact ? "text-[8px] md:text-xs" : "text-xs"}`}>({r.applications})</div>
            </div>
            <div className={`font-bold text-ink leading-tight ${compact ? "text-[11px] md:text-2xl" : "text-2xl"}`}>{r.ui}</div>
          </div>
        ))}
      </div>
      <div className={`flex items-center gap-1 border-t border-border bg-sand/60 text-muted-foreground ${compact ? "px-2 py-1.5 text-[8px] md:px-6 md:py-4 md:text-xs" : "px-3 py-2 text-[9px] md:px-6 md:py-4 md:text-xs"}`}>
        <Info className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary shrink-0" />
        <span className="leading-tight">*1 dose/semana. Consulte seu médico.</span>
      </div>
    </div>
  );
}

export function DosageTable() {
  const [zoom, setZoom] = useState<ZoomTarget>(null);

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

      <div className="mt-10 grid grid-cols-2 gap-3 md:gap-6">
        <button
          type="button"
          onClick={() => setZoom("custom")}
          className="group relative text-left"
          aria-label="Ampliar tabela de dosagem"
        >
          <CustomTable compact />
          <span className="absolute top-2 right-2 md:top-3 md:right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] md:text-xs font-semibold text-ink shadow">
            <Maximize2 className="h-3 w-3" /> Zoom
          </span>
        </button>

        <button
          type="button"
          onClick={() => setZoom("official")}
          className="group relative card-premium overflow-hidden"
          aria-label="Ampliar tabela oficial"
        >
          <img
            src={media.tabela}
            alt="Tabela de fracionamento oficial T.G.15"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-transparent" />
          <span className="absolute top-2 right-2 md:top-3 md:right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] md:text-xs font-semibold text-ink shadow">
            <Maximize2 className="h-3 w-3" /> Zoom
          </span>
        </button>
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
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-[100] grid place-items-center bg-ink/85 backdrop-blur-sm p-4"
        >
          <button
            onClick={() => setZoom(null)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="flex flex-col items-center gap-4 max-h-full w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[75vh] max-w-[95vw] overflow-auto rounded-2xl shadow-2xl bg-white">
              {zoom === "custom" ? (
                <div className="w-[92vw] max-w-3xl">
                  <CustomTable />
                </div>
              ) : (
                <img
                  src={media.tabela}
                  alt="Tabela ampliada"
                  className="max-h-[75vh] max-w-[95vw] object-contain"
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => setZoom(zoom === "custom" ? "official" : "custom")}
              className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-ink shadow hover:bg-white"
            >
              Ver {zoom === "custom" ? "tabela oficial" : "tabela de dosagem"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
