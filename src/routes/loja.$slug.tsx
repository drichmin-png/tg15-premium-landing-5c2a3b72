import { createFileRoute } from "@tanstack/react-router";
import { StorefrontPage } from "@/components/site/StorefrontPage";

export const Route = createFileRoute("/loja/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Loja ${params.slug} — T.G.15` },
      { name: "description", content: "Link exclusivo do operador para compra do T.G.15 Tirzepatida 15mg/0,5mL." },
      { property: "og:title", content: `Loja ${params.slug} — T.G.15` },
      { property: "og:description", content: "Compre T.G.15 pelo link exclusivo deste operador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OperatorStorefront,
});

function OperatorStorefront() {
  const { slug } = Route.useParams();
  return <StorefrontPage operatorSlug={slug} />;
}