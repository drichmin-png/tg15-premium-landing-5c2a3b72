import { createFileRoute } from "@tanstack/react-router";
import { StorefrontPage } from "@/components/site/StorefrontPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "T.G.15 Tirzepatida — Compra Oficial" },
      { name: "description", content: "Compre T.G.15 Tirzepatida 15mg/0,5mL com checkout seguro, Pix e envio refrigerado." },
      { property: "og:title", content: "T.G.15 Tirzepatida — Compra Oficial" },
      { property: "og:description", content: "T.G.15 Tirzepatida 15mg/0,5mL com opções de ampola individual e caixa completa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <StorefrontPage />,
});
