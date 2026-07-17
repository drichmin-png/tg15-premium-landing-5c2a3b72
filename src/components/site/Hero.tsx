import { ShieldCheck, MessageCircle, Users } from "lucide-react";
import { media } from "@/lib/product";
import { useAdmin } from "@/lib/admin-store";

export function Hero() {
  const { hero, support } = useAdmin();
  const phone = (support.whatsappPhone || "").replace(/\D/g, "");
  const waLink = phone ? `https://wa.me/${phone}` : "";
  const groupLink = support.whatsappGroupLink || "";
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-40 right-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      </div>
      <div className="container-x grid gap-10 py-10 md:py-16 lg:grid-cols-[1.1fr_1fr] items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.06] px-4 py-1.5 text-xs font-semibold text-primary-deep">
            <ShieldCheck className="h-3.5 w-3.5" /> {hero.eyebrow}
          </div>
          <h1 className="heading-display mt-6 text-4xl md:text-5xl lg:text-6xl text-ink">
            {hero.titleLine1}
            <br />
            <span className="text-gradient-brand">{hero.titleLine2}</span>
          </h1>
          <div className="mt-6 h-[2px] w-32 gradient-brand rounded-full" />
          <p className="mt-6 text-lg md:text-xl font-semibold text-ink">
            {hero.subtitle}
          </p>
          <p className="mt-3 max-w-md text-muted-foreground">
            {hero.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#comprar"
              className="btn-shine relative inline-flex items-center gap-2 rounded-full gradient-brand px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-primary/30 transition-transform hover:scale-[1.02]"
            >
              <span className="btn-shine-inner" />
              <span className="relative">{hero.ctaLabel}</span>
            </a>
            <a
              href="#beneficios"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold text-ink hover:border-primary/40"
            >
              Conhecer benefícios
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/20 to-transparent blur-2xl" />
          <img
            src={media.hero}
            alt="T.G.15 Tirzepatida — transforme sua jornada"
            className="w-full rounded-[2rem] object-cover shadow-2xl shadow-primary/10 animate-float"
          />
        </div>
      </div>
    </section>
  );
}
