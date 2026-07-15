import { Activity, Brain, Droplet, HeartPulse, ShieldCheck, TrendingDown } from "lucide-react";

const items = [
  { icon: TrendingDown, title: "Emagrecimento Eficaz", text: "Perda de peso segura e contínua com melhora da composição corporal." },
  { icon: Brain, title: "Saúde Mental", text: "Favorece equilíbrio do humor e bem-estar durante a jornada de emagrecimento." },
  { icon: Droplet, title: "Perfil Lipídico", text: "Auxilia a reduzir colesterol e triglicerídeos, protegendo o coração." },
  { icon: Activity, title: "Controle Glicêmico", text: "Equilibra os níveis de glicose no sangue e reduz picos glicêmicos." },
  { icon: HeartPulse, title: "Saúde Cardiovascular", text: "Contribui para a saúde do coração ao longo do tratamento." },
  { icon: ShieldCheck, title: "Alta Qualidade", text: "Formulação farmacêutica de alta pureza, com padrão de excelência." },
];

export function Benefits() {
  return (
    <section id="beneficios" className="container-x mt-24">
      <div className="max-w-2xl">
        <div className="eyebrow">Por que T.G.15</div>
        <h2 className="heading-display mt-3 text-4xl md:text-5xl text-ink">
          Ciência aplicada à sua <span className="text-gradient-brand">transformação</span>
        </h2>
        <p className="mt-3 text-muted-foreground">
          Tirzepatida de alta pureza formulada para resultados reais, mensuráveis e consistentes.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card-premium group relative overflow-hidden p-6 transition-transform hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/8 blur-2xl transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="inline-grid h-11 w-11 place-items-center rounded-xl gradient-brand text-white shadow-md shadow-primary/25">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
