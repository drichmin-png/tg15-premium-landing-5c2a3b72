import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getLocalTenantByShortcode } from "@/lib/saas-local";
import { StorefrontPage } from "@/components/site/StorefrontPage";

export const Route = createFileRoute("/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Loja ${params.code} — T.G.15` },
      { name: "description", content: "Link exclusivo do operador — T.G.15 Tirzepatida." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OperatorShortRoute,
});

function OperatorShortRoute() {
  const { code } = Route.useParams();
  const [slug, setSlug] = useState<string | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    const tenant = getLocalTenantByShortcode(code);
    if (tenant) {
      // If a setup token is attached, this is an operator opening their
      // management link on a new device — send them to the login flow so the
      // token can seed credentials, then they land on their admin panel.
      const search = typeof window !== "undefined" ? window.location.search : "";
      if (search.includes("setup=")) {
        window.location.replace(`/app/${tenant.slug}/login${search}`);
        return;
      }
      setSlug(tenant.slug);
      return;
    }
    setNotFoundState(true);
  }, [code]);

  if (notFoundState) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="text-sm font-semibold text-ink">
          Link inválido ou operador não encontrado neste dispositivo.
        </div>
        <a href="/" className="text-xs text-primary underline">
          Voltar para o início
        </a>
      </main>
    );
  }

  if (!slug) return <div className="min-h-screen bg-background" />;

  return <StorefrontPage operatorSlug={slug} />;
}
