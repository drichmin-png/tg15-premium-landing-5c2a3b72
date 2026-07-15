import { useState } from "react";
import { Play } from "lucide-react";
import { media } from "@/lib/product";

function VideoCard({ src, label, tall = false }: { src: string; label: string; tall?: boolean }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className={`card-premium relative overflow-hidden bg-ink ${tall ? "aspect-[9/16]" : "aspect-video"}`}>
      {playing ? (
        <video src={src} controls autoPlay playsInline className="h-full w-full object-cover" />
      ) : (
        <button onClick={() => setPlaying(true)} className="group relative h-full w-full">
          <video
            src={src}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
          />
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-t from-ink/70 via-ink/10 to-transparent">
            <span className="grid h-16 w-16 place-items-center rounded-full gradient-brand text-white shadow-2xl shadow-primary/40 transition-transform group-hover:scale-110">
              <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
            </span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-left text-white">
            <div className="text-sm font-semibold">{label}</div>
          </div>
        </button>
      )}
    </div>
  );
}

export function VideoSection() {
  return (
    <>
      <section id="aplicacao" className="container-x mt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] items-center">
          <div>
            <div className="eyebrow">Aplicação</div>
            <h2 className="heading-display mt-3 text-4xl md:text-5xl text-ink">
              Simples, seguro e <span className="text-gradient-brand">semanal</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Assista ao passo a passo oficial de aplicação subcutânea e veja a apresentação
              detalhada do produto T.G.15.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-foreground/80">
              <li>• Aplicação subcutânea uma vez por semana</li>
              <li>• Kit prático para uso doméstico</li>
              <li>• Armazenamento refrigerado entre 2°C e 8°C</li>
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <VideoCard src={media.videos.apresentacao} label="Apresentação do produto" tall />
            <VideoCard src={media.videos.comoUsar} label="Como usar" tall />
          </div>
        </div>
      </section>

      <section id="resultados" className="container-x mt-24">
        <div className="max-w-2xl">
          <div className="eyebrow">Resultados Reais</div>
          <h2 className="heading-display mt-3 text-4xl md:text-5xl text-ink">
            Antes e <span className="text-gradient-brand">depois</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Transformações verdadeiras de pessoas que confiaram no T.G.15.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {media.videos.antesDepois.map((src, i) => (
            <VideoCard key={src} src={src} label={`Antes e depois — Relato ${i + 1}`} tall />
          ))}
        </div>
      </section>

      <section className="container-x mt-24">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] items-center">
          <div className="order-2 lg:order-1 grid gap-4 sm:grid-cols-1">
            <VideoCard src={media.videos.duvidas} label="Tirando dúvidas" />
          </div>
          <div className="order-1 lg:order-2">
            <div className="eyebrow">Explicações</div>
            <h2 className="heading-display mt-3 text-4xl md:text-5xl text-ink">
              Suas dúvidas, <span className="text-gradient-brand">respondidas</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Explicação em vídeo sobre o T.G.15, dosagem, cuidados e resultados esperados.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
