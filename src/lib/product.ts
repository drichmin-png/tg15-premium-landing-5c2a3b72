import ampola from "@/assets/ampola.png.asset.json";
import caixa from "@/assets/caixa-4-ampolas.png";
import hero from "@/assets/hero-transforme-v2.png.asset.json";
import tabela from "@/assets/tabela-fracionamento.png.asset.json";
import comoUsar from "@/assets/como-usar.mp4.asset.json";
import apresentacao from "@/assets/apresentacao-produto.mp4.asset.json";
import antes0 from "@/assets/antes-depois-0.mp4.asset.json";
import antes1 from "@/assets/antes-depois-1.mp4.asset.json";
import antes2 from "@/assets/antes-depois-2.mp4.asset.json";
import antes3 from "@/assets/antes-depois-3.mp4.asset.json";
import duvidas from "@/assets/tirando-duvidas.mp4.asset.json";
import { assetUrl } from "@/lib/asset-url";

export const media = {
  ampola: assetUrl(ampola.url),
  caixa,
  hero: assetUrl(hero.url),
  tabela: assetUrl(tabela.url),
  videos: {
    apresentacao: { src: assetUrl(apresentacao.url), poster: "/poster-apresentacao.jpg" },
    comoUsar: { src: assetUrl(comoUsar.url), poster: "/poster-como-usar.jpg" },
    duvidas: { src: assetUrl(duvidas.url), poster: "/poster-duvidas.jpg" },
    antesDepois: [
      { src: assetUrl(antes0.url), poster: "/poster-antes-depois-0.jpg" },
      { src: assetUrl(antes1.url), poster: "/poster-antes-depois-1.jpg" },
      { src: assetUrl(antes2.url), poster: "/poster-antes-depois-2.jpg" },
      { src: assetUrl(antes3.url), poster: "/poster-antes-depois-3.jpg" },
    ],
  },
};

export type VariantId = "single" | "box";

export const variants: Record<VariantId, {
  id: VariantId;
  name: string;
  units: number;
  price: number;
  image: string;
  badge?: string;
}> = {
  single: {
    id: "single",
    name: "1 Ampola T.G.15",
    units: 1,
    price: 145,
    image: media.ampola,
  },
  box: {
    id: "box",
    name: "Caixa Completa T.G.15",
    units: 4,
    price: 521,
    image: media.caixa,
    badge: "Mais Vendido",
  },
};

export const SINGLE_PRICE = 145;
export const BOX_PRICE = 521;
export const BOX_UNIT_TOTAL = SINGLE_PRICE * 4; // 580
export const BOX_SAVINGS = BOX_UNIT_TOTAL - BOX_PRICE; // 59

export const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
