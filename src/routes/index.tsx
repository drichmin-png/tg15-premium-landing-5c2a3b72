import { createFileRoute } from "@tanstack/react-router";
import { StorefrontPage } from "@/components/site/StorefrontPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "T.G.15 — Tirzepatida 15mg/0,5mL | Emagreça com equilíbrio" },
      {
        name: "description",
        content:
          "T.G.15 Tirzepatida 15mg/0,5mL: auxilia no controle do apetite e no emagrecimento com acompanhamento profissional. Caixa completa e ampola avulsa.",
      },
      { property: "og:title", content: "T.G.15 — Tirzepatida 15mg/0,5mL" },
      {
        property: "og:description",
        content: "Reencontre sua melhor versão com T.G.15 — mais leveza, confiança e liberdade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <StorefrontPage />,
});
