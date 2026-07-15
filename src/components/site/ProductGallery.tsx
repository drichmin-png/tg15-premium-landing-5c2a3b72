import { useState } from "react";
import { Play, ZoomIn } from "lucide-react";
import { media } from "@/lib/product";

type Slide =
  | { kind: "image"; src: string; alt: string }
  | { kind: "video"; src: string; poster?: string; label: string };

const slides: Slide[] = [
  { kind: "image", src: media.caixa, alt: "Caixa T.G.15 com 4 ampolas" },
  { kind: "image", src: media.ampola, alt: "Ampola T.G.15 Tirzepatida 15mg/0,5mL" },
  { kind: "image", src: media.hero, alt: "Detalhes do produto T.G.15" },
  { kind: "video", src: media.videos.apresentacao, label: "Apresentação do produto" },
  { kind: "video", src: media.videos.comoUsar, label: "Como usar" },
];

export function ProductGallery() {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const current = slides[active];

  return (
    <div className="lg:sticky lg:top-24 flex flex-col-reverse gap-4 lg:flex-row">
      <div className="flex gap-3 lg:flex-col overflow-x-auto lg:overflow-visible">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => { setActive(i); setZoom(false); }}
            className={`relative shrink-0 h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
              i === active ? "border-primary shadow-md shadow-primary/20" : "border-border hover:border-primary/40"
            }`}
            aria-label={`Ver mídia ${i + 1}`}
          >
            {s.kind === "image" ? (
              <img src={s.src} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="relative h-full w-full bg-ink">
                <video src={s.src} className="h-full w-full object-cover opacity-70" muted preload="metadata" />
                <Play className="absolute inset-0 m-auto h-6 w-6 text-white" fill="currentColor" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="relative flex-1 aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-sand to-white card-premium">
        {current.kind === "image" ? (
          <>
            <button
              type="button"
              onClick={() => setZoom((z) => !z)}
              onMouseMove={(e) => {
                if (!zoom) return;
                const r = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width) * 100;
                const y = ((e.clientY - r.top) / r.height) * 100;
                setOrigin(`${x}% ${y}%`);
              }}
              className="group absolute inset-0"
              aria-label="Ampliar imagem"
            >
              <img
                src={current.src}
                alt={current.alt}
                className="h-full w-full object-contain p-8 transition-transform duration-500"
                style={{
                  transform: zoom ? "scale(2)" : "scale(1)",
                  transformOrigin: origin,
                }}
              />
              <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-medium text-ink shadow">
                <ZoomIn className="h-3.5 w-3.5" /> {zoom ? "Reduzir" : "Zoom"}
              </span>
            </button>
          </>
        ) : (
          <video
            key={current.src}
            src={current.src}
            controls
            playsInline
            className="h-full w-full object-cover bg-ink"
          />
        )}
      </div>
    </div>
  );
}
