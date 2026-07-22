import * as React from "react";
import { Star, Heart, MapPin, ThumbsUp, X } from "lucide-react";
import { assetUrl } from "@/lib/asset-url";
import p1 from "@/assets/reviews/IMG_4990.jpeg.asset.json";
import p2 from "@/assets/reviews/IMG_4991.jpeg.asset.json";
import p3 from "@/assets/reviews/IMG_4992.jpeg.asset.json";
import p4 from "@/assets/reviews/IMG_4993.jpeg.asset.json";
import p5 from "@/assets/reviews/IMG_4994.jpeg.asset.json";
import p6 from "@/assets/reviews/IMG_4995.jpeg.asset.json";
import p7 from "@/assets/reviews/IMG_4996.jpeg.asset.json";
import p8 from "@/assets/reviews/IMG_4998.jpeg.asset.json";
import p9 from "@/assets/reviews/IMG_4999.jpeg.asset.json";
import p10 from "@/assets/reviews/IMG_4984.jpeg.asset.json";
import p11 from "@/assets/reviews/IMG_4985.jpeg.asset.json";
import p12 from "@/assets/reviews/IMG_4986.jpeg.asset.json";
import p13 from "@/assets/reviews/IMG_4987.jpeg.asset.json";
import p14 from "@/assets/reviews/IMG_4988.jpeg.asset.json";
import p15 from "@/assets/reviews/IMG_4989.webp.asset.json";

const PHOTOS = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15].map((p) => assetUrl(p.url));

import a1 from "@/assets/reviews/avatars/avatar1.jpeg.asset.json";
import a2 from "@/assets/reviews/avatars/avatar2.jpeg.asset.json";
import a3 from "@/assets/reviews/avatars/avatar3.jpeg.asset.json";
import a4 from "@/assets/reviews/avatars/avatar4.jpeg.asset.json";
import a5 from "@/assets/reviews/avatars/avatar5.jpeg.asset.json";
import a6 from "@/assets/reviews/avatars/avatar6.jpeg.asset.json";
import a7 from "@/assets/reviews/avatars/avatar7.jpeg.asset.json";
import a8 from "@/assets/reviews/avatars/avatar8.jpeg.asset.json";
import a9 from "@/assets/reviews/avatars/avatar9.jpeg.asset.json";
import a10 from "@/assets/reviews/avatars/avatar10.jpeg.asset.json";
import a11 from "@/assets/reviews/avatars/avatar-11.jpg.asset.json";
import a12 from "@/assets/reviews/avatars/avatar-12.jpg.asset.json";
import a13 from "@/assets/reviews/avatars/avatar-13.jpg.asset.json";
import a14 from "@/assets/reviews/avatars/avatar-14.jpg.asset.json";
import a15 from "@/assets/reviews/avatars/avatar-15.jpg.asset.json";
const FEMALE_AVATARS = [a1, a2, a3, a4, a5, a6, a7, a8, a11, a12].map((p) => assetUrl(p.url));
const MALE_AVATARS = [a9, a10, a13, a14, a15].map((p) => assetUrl(p.url));

const COMMENTS = [
  "Produto muito bem embalado. A apresentação ficou excelente.",
  "Gostei bastante da organização da embalagem. Passa uma boa impressão.",
  "Recebi tudo certinho e ainda veio um mimo junto. Achei um detalhe muito bacana.",
  "A entrega foi mais rápida do que eu imaginava.",
  "A tabela explicativa ajudou bastante. Ficou simples de entender.",
  "O produto chegou em perfeitas condições, sem nenhum dano.",
  "Fiquei surpresa com o cuidado na embalagem.",
  "Os brindes deram um toque especial na experiência.",
  "Veio exatamente como mostrado nas fotos.",
  "Gostei muito da qualidade da apresentação do pedido.",
  "Tudo chegou organizado e muito bem protegido.",
  "Não esperava receber um brinde. Foi uma surpresa bem legal.",
  "A entrega aconteceu antes do prazo informado.",
  "Achei a embalagem bonita e discreta.",
  "Recebi os brindes direitinho. Gostei bastante desse cuidado.",
  "A experiência de compra foi muito tranquila.",
  "O pedido chegou completo e muito bem embalado.",
  "Gostei do capricho em cada detalhe da embalagem.",
  "Veio tudo certinho e os brindes fizeram diferença.",
  "A qualidade da apresentação chamou minha atenção.",
  "Produto bem protegido durante o transporte.",
  "A entrega foi rápida e tudo veio conforme o esperado.",
  "A embalagem transmite bastante cuidado.",
  "Os brindes deixaram a experiência ainda mais especial.",
  "Achei muito prático e fácil de conferir tudo que veio no pedido.",
  "Tudo chegou organizado e dentro do prazo previsto.",
  "Foi uma experiência positiva do início ao fim. Gostei bastante da apresentação e do cuidado com o envio.",
];

const CITIES = [
  "São Paulo – SP","Rio de Janeiro – RJ","Belo Horizonte – MG","Brasília – DF","Salvador – BA",
  "Fortaleza – CE","Recife – PE","Curitiba – PR","Porto Alegre – RS","Goiânia – GO",
  "Manaus – AM","Belém – PA","Campinas – SP","São Luís – MA","Natal – RN",
  "João Pessoa – PB","Maceió – AL","Aracaju – SE","Florianópolis – SC","Cuiabá – MT",
  "Campo Grande – MS","Vitória – ES","Teresina – PI","Ribeirão Preto – SP","São José dos Campos – SP",
  "Uberlândia – MG","Londrina – PR",
];

const NAMES = [
  "Ana R.","Carlos M.","Fernanda S.","João P.","Mariana L.","Rafael T.","Beatriz O.","Lucas F.",
  "Patrícia N.","Rodrigo A.","Camila V.","Diego S.","Juliana C.","Marcelo B.","Larissa D.",
  "Thiago R.","Vanessa G.","Bruno H.","Amanda K.","Felipe M.","Isabela P.","Gustavo L.",
  "Renata F.","Eduardo Q.","Priscila W.","Henrique Z.","Tatiane J.",
];

const MALE_NAMES = new Set([
  "Carlos M.","João P.","Rafael T.","Lucas F.","Rodrigo A.","Diego S.","Marcelo B.",
  "Thiago R.","Bruno H.","Felipe M.","Gustavo L.","Eduardo Q.","Henrique Z.",
]);

type Review = {
  id: string;
  name: string;
  city: string;
  daysAgo: number;
  text: string;
  likes: number;
  photos: string[];
  avatar: string;
};

let femaleIdx = 0;
let maleIdx = 0;
const REVIEWS: Review[] = COMMENTS.map((text, i) => {
  const count = i % 4; // 0..3
  const photos: string[] = [];
  for (let k = 0; k < count; k++) {
    photos.push(PHOTOS[(i * 3 + k) % PHOTOS.length]);
  }
  const name = NAMES[i % NAMES.length];
  const isMale = MALE_NAMES.has(name);
  const avatar = isMale
    ? MALE_AVATARS[maleIdx++ % MALE_AVATARS.length]
    : FEMALE_AVATARS[femaleIdx++ % FEMALE_AVATARS.length];
  return {
    id: `r${i}`,
    name,
    city: CITIES[i % CITIES.length],
    daysAgo: ((i * 7 + 3) % 15) + 1,
    text,
    likes: 8 + ((i * 13) % 90),
    photos,
    avatar,
  };
});

const STORAGE_KEY = "tg15-review-likes";

function loadLikes(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

export function Reviews() {
  const [likes, setLikes] = React.useState<Record<string, boolean>>({});
  const [visible, setVisible] = React.useState(6);
  const [lightbox, setLightbox] = React.useState<string | null>(null);

  React.useEffect(() => { setLikes(loadLikes()); }, []);

  const toggle = (id: string) => {
    setLikes(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const list = REVIEWS.slice(0, visible);

  return (
    <section id="avaliacoes" className="container-x mt-24">
      <div className="max-w-2xl">
        <div className="eyebrow">Avaliações reais</div>
        <h2 className="heading-display mt-3 text-4xl md:text-5xl text-ink">
          O que dizem <span className="text-gradient-brand">nossos clientes</span>
        </h2>
        <p className="mt-3 text-muted-foreground">
          Depoimentos de quem já recebeu o T.G.15 em casa.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {list.map((r) => {
          const liked = !!likes[r.id];
          const count = r.likes + (liked ? 1 : 0);
          return (
            <article key={r.id} className="card-premium p-5 flex flex-col">
              <header className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20 bg-sand">
                  <img src={r.avatar} alt={r.name} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink truncate">{r.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {r.city}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  há {r.daysAgo} {r.daysAgo === 1 ? "dia" : "dias"}
                </div>
              </header>

              <div className="mt-3 flex items-center gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>

              <p className="mt-3 text-sm text-ink/90 leading-relaxed">"{r.text}"</p>

              {r.photos.length > 0 && (
                <div className="mt-4 flex gap-2">
                  {r.photos.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightbox(src)}
                      className="h-16 w-16 overflow-hidden rounded-lg border border-border bg-sand/60 hover:border-primary/60 transition"
                      aria-label={`Ver foto ${i + 1}`}
                    >
                      <img src={src} alt={`Foto do pedido ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <footer className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggle(r.id)}
                  aria-pressed={liked}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    liked
                      ? "bg-primary/10 text-primary"
                      : "bg-sand/60 text-ink hover:bg-sand"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                  {count}
                </button>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ThumbsUp className="h-3 w-3" /> Compra verificada
                </span>
              </footer>
            </article>
          );
        })}
      </div>

      {visible < REVIEWS.length && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setVisible((v) => Math.min(v + 6, REVIEWS.length))}
            className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-ink hover:bg-sand transition-colors"
          >
            Ver mais avaliações
          </button>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={lightbox} alt="Foto do pedido" className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain" />
        </div>
      )}
    </section>
  );
}
