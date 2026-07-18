import { useState } from "react";
import { Play } from "lucide-react";
import { media } from "@/lib/product";
import { assetUrl } from "@/lib/asset-url";
import gordao from "@/assets/gordao-xj.jpg.asset.json";
import jojo from "@/assets/jojo-todynho.jpg.asset.json";
import nicolle from "@/assets/nicolle-caroline.png.asset.json";

type VideoCardProps = {
  src: string;
  poster: string;
  label: string;
  orientation?: "portrait" | "landscape";
  fit?: "cover" | "contain";
};

function VideoCard({ src, poster, label, orientation = "landscape", fit = "cover" }: VideoCardProps) {
  const [playing, setPlaying] = useState(false);
  const aspect = orientation === "portrait" ? "aspect-[9/16]" : "aspect-video";
  const objectFit = fit === "contain" ? "object-contain" : "object-cover";
  return (
    <div className={`card-premium relative overflow-hidden bg-ink ${aspect}`}>
      {playing ? (
        <video src={src} poster={poster} controls autoPlay playsInline className={`h-full w-full ${objectFit}`} />
      ) : (
        <button onClick={() => setPlaying(true)} className="group relative h-full w-full">
          <img
            src={poster}
            alt={label}
            className={`h-full w-full ${objectFit} opacity-90 transition-opacity group-hover:opacity-100`}
          />
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-t from-ink/60 via-ink/5 to-transparent">
            <span className="grid h-14 w-14 place-items-center rounded-full gradient-brand text-white shadow-2xl shadow-primary/40 transition-transform group-hover:scale-110">
              <Play className="h-5 w-5 translate-x-0.5" fill="currentColor" />
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 text-left text-white">
            <div className="text-xs font-semibold tracking-wide">{label}</div>
          </div>
        </button>
      )}
    </div>
  );
}

const testimonials = [
  {
    name: "Maria Santos",
    text: "Iniciou o acompanhamento com 110 kg e, após 9 semanas, atingiu 87 kg. Durante o período, utilizou tirzepatida 2,5 mg uma vez por semana, seguindo um plano alimentar orientado e mantendo uma rotina regular de atividades físicas. A evolução foi acompanhada semanalmente, com redução média de peso ao longo do tratamento. Os resultados variam de pessoa para pessoa e este é apenas um exemplo ilustrativo.",
    from: "110 kg",
    to: "87 kg",
    weeks: "9 semanas",
  },
  {
    name: "Juliana Oliveira",
    text: "Começou o tratamento com 96 kg e, após 12 semanas, alcançou 81 kg. O protocolo incluiu aplicações semanais conforme orientação médica, alimentação balanceada, hidratação adequada e caminhadas frequentes. Ao longo do acompanhamento, também relatou maior controle do apetite e facilidade para seguir a dieta. Este é um caso fictício criado apenas para fins de demonstração.",
    from: "96 kg",
    to: "81 kg",
    weeks: "12 semanas",
  },
  {
    name: "Patrícia Lima",
    text: "Iniciou o programa pesando 102 kg e chegou a 84 kg em 14 semanas. Além do tratamento prescrito, manteve acompanhamento nutricional e incorporou exercícios leves à rotina. A paciente relatou melhora na saciedade e maior facilidade para manter hábitos saudáveis. Exemplo fictício; não representa um resultado garantido.",
    from: "102 kg",
    to: "84 kg",
    weeks: "14 semanas",
  },
  {
    name: "Fernanda Costa",
    text: "Começou o tratamento com 89 kg e, após 10 semanas, passou a pesar 76 kg. Durante esse período, seguiu as orientações médicas, realizou aplicações semanais, adotou uma alimentação equilibrada e praticou atividades físicas de forma regular. A evolução ocorreu gradualmente ao longo do acompanhamento. Caso fictício criado apenas para ilustrar a apresentação de resultados.",
    from: "89 kg",
    to: "76 kg",
    weeks: "10 semanas",
  },
];

type Celebrity = {
  name: string;
  role: string;
  image?: string;
  initials: string;
  story: { label: string; text: string }[];
};

const celebrities: Celebrity[] = [
  {
    name: "Elon Musk",
    role: "Empresário — Tesla, SpaceX, xAI",
    initials: "EM",
    story: [
      { label: "Como começou", text: "Em 2022, na rede X (antigo Twitter), Elon Musk respondeu a seguidores dizendo que havia perdido peso por meio de jejum, mudanças na alimentação e uso do Mounjaro (tirzepatida)." },
      { label: "Durante o tratamento", text: "Segundo ele, o medicamento foi utilizado como um auxílio ao emagrecimento, em conjunto com hábitos alimentares mais saudáveis." },
      { label: "Resultado", text: "Relatou melhora significativa na composição corporal e sentir-se em melhor forma física. Não informou oficialmente o total de quilos perdidos." },
    ],
  },
  {
    name: "Jojo Todynho",
    role: "Cantora e apresentadora brasileira",
    image: assetUrl(jojo.url),
    initials: "JT",
    story: [
      { label: "Como começou", text: "Após realizar cirurgia bariátrica, Jojo explicou que utilizou o Mounjaro apenas como complemento do processo de emagrecimento." },
      { label: "Durante o tratamento", text: "Seguiu acompanhamento médico, manteve alimentação equilibrada e praticou atividade física regularmente." },
      { label: "Resultado", text: "Relatou perda de mais de 80 kg ao longo de todo o processo — resultado da combinação de cirurgia, dieta, exercícios e acompanhamento médico." },
    ],
  },
  {
    name: "Wesley Safadão",
    role: "Cantor e compositor brasileiro",
    initials: "WS",
    story: [
      { label: "Como começou", text: "O cantor confirmou publicamente que utilizou Mounjaro durante seu processo de emagrecimento." },
      { label: "Durante o tratamento", text: "Contou com acompanhamento profissional, adotou alimentação mais controlada e manteve rotina de exercícios físicos." },
      { label: "Resultado", text: "Relatou perda de aproximadamente 10 kg, tendo como principal objetivo melhorar a saúde e a qualidade de vida." },
    ],
  },
  {
    name: "Gordão da XJ",
    role: "Sidney Bezerra — influenciador digital",
    image: assetUrl(gordao.url),
    initials: "GX",
    story: [
      { label: "Início da transformação", text: "Peso máximo divulgado: aproximadamente 345 kg. Decidiu mudar de vida após receber alertas médicos e passou a documentar toda a evolução nas redes sociais." },
      { label: "Como foi o tratamento", text: "Acompanhamento médico, reeducação alimentar, musculação, atividades físicas, medicamentos prescritos em diferentes fases e, posteriormente, cirurgia bariátrica." },
      { label: "Resultado", text: "Eliminou cerca de 130 kg, chegando a aproximadamente 220 kg, e segue o tratamento com a meta de continuar emagrecendo de forma saudável." },
    ],
  },
  {
    name: "Nicolle Caroline",
    role: "Influenciadora e estudante de enfermagem",
    image: assetUrl(nicolle.url),
    initials: "NC",
    story: [
      { label: "Como começou", text: "Ganhou notoriedade ao acompanhar a rotina saudável ao lado de Sidney Bezerra (Gordão da XJ), com academia diária, alimentação balanceada e mudança completa de hábitos." },
      { label: "Uso de Mounjaro?", text: "Não há confirmação pública de que Nicolle tenha utilizado tirzepatida. Sua transformação foi atribuída a reeducação alimentar, treinos, disciplina e mudança de hábitos." },
      { label: "Resultado", text: "Relatou aproximadamente 12 kg eliminados durante o namoro e, posteriormente, atualização mostrando 20 kg de perda de peso desde o início da transformação." },
    ],
  },
];

export function VideoSection() {
  return (
    <>
      {/* Aplicação — landscape videos */}
      <section id="aplicacao" className="container-x mt-20">
        <div className="max-w-2xl">
          <div className="eyebrow">Aplicação</div>
          <h2 className="heading-display mt-3 text-3xl md:text-4xl text-ink">
            Simples, seguro e <span className="text-gradient-brand">semanal</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Assista à apresentação oficial e ao passo a passo de aplicação subcutânea do T.G.15.
          </p>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <VideoCard src={media.videos.apresentacao.src} poster={media.videos.apresentacao.poster} label="Apresentação do produto" orientation="landscape" fit="contain" />
            <div className="mt-3 text-sm font-semibold text-ink">Apresentação do produto</div>
            <p className="text-sm text-muted-foreground">Conheça em detalhes a embalagem, o kit e as características do T.G.15.</p>
          </div>
          <div>
            <VideoCard src={media.videos.comoUsar.src} poster={media.videos.comoUsar.poster} label="Como usar" orientation="landscape" fit="contain" />
            <div className="mt-3 text-sm font-semibold text-ink">Como usar</div>
            <p className="text-sm text-muted-foreground">Aplicação subcutânea uma vez por semana, com armazenamento entre 2°C e 8°C.</p>
          </div>
        </div>
      </section>

      {/* Antes e depois — video + testimonial */}
      <section id="resultados" className="container-x mt-20">
        <div className="max-w-2xl">
          <div className="eyebrow">Resultados Reais</div>
          <h2 className="heading-display mt-3 text-3xl md:text-4xl text-ink">
            Antes e <span className="text-gradient-brand">depois</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Casos ilustrativos de acompanhamento com tirzepatida. Os resultados variam de pessoa para pessoa.
          </p>
        </div>

        <div className="mt-8 grid gap-4 grid-cols-2 lg:gap-8 lg:grid-cols-4">
          {media.videos.antesDepois.map((src, i) => {
            const t = testimonials[i];
            return (
              <article key={src} className="card-premium overflow-hidden flex flex-col">
                <VideoCard src={src} label={`Relato ${i + 1}`} orientation="portrait" fit="cover" />
                <div className="p-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="heading-display text-xl text-ink">{t.name}</h3>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                      Caso fictício
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-sand px-2.5 py-1 font-semibold text-ink">{t.from}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="rounded-full gradient-brand px-2.5 py-1 font-semibold text-white">{t.to}</span>
                    <span className="text-muted-foreground">· {t.weeks}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">{t.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Famosos que também trataram */}
      <section id="famosos" className="container-x mt-20">
        <div className="max-w-2xl">
          <div className="eyebrow">Personalidades</div>
          <h2 className="heading-display mt-3 text-3xl md:text-4xl text-ink">
            Também <span className="text-gradient-brand">confiaram</span> no tratamento
          </h2>
          <p className="mt-3 text-muted-foreground">
            Personalidades que relataram publicamente o uso de tirzepatida (Mounjaro) ou combinaram
            o medicamento a mudanças de estilo de vida durante sua transformação.
          </p>
        </div>

        <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {celebrities.map((c) => (
            <article key={c.name} className="card-premium overflow-hidden flex flex-col">
              {c.image ? (
                <div className="aspect-video w-full overflow-hidden bg-sand">
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video w-full grid place-items-center gradient-brand">
                  <span className="heading-display text-4xl lg:text-6xl text-white/90">{c.initials}</span>
                </div>
              )}
              <div className="p-3 lg:p-5 flex-1 flex flex-col">
                <h3 className="heading-display text-base lg:text-xl text-ink">{c.name}</h3>
                <div className="text-[10px] lg:text-xs text-muted-foreground">{c.role}</div>
                <div className="mt-2 lg:mt-4 space-y-2 lg:space-y-3">
                  {c.story.map((s) => (
                    <div key={s.label}>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-primary-deep">{s.label}</div>
                      <p className="mt-0.5 lg:mt-1 text-xs lg:text-sm leading-relaxed text-foreground/80">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground max-w-3xl">
          As informações apresentadas nesta seção foram compiladas a partir de declarações públicas
          e reportagens sobre cada personalidade. Cada caso é único; resultados dependem de
          orientação médica, hábitos alimentares e prática de atividades físicas.
        </p>
      </section>

      {/* Dúvidas */}
      <section className="container-x mt-20">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
          <div className="order-2 lg:order-1">
            <VideoCard src={media.videos.duvidas} label="Tirando dúvidas" orientation="landscape" fit="contain" />
          </div>
          <div className="order-1 lg:order-2">
            <div className="eyebrow">Explicações</div>
            <h2 className="heading-display mt-3 text-3xl md:text-4xl text-ink">
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
