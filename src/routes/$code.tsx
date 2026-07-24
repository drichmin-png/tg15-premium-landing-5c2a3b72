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

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const tenant = getLocalTenantByShortcode(code);
    if (tenant) {
      if (search.includes("setup=")) {
        window.location.replace(`/app/${tenant.slug}/login${search}`);
        return;
      }
      setSlug(tenant.slug);
      return;
    }
    // Fallback: unknown shortcode on this device — treat the code as a slug and
    // let the storefront hydrate remotely from the server-side namespaced config.
    // Valid slug shape (a-z0-9-, 1-40 chars) covers all operator slugs we accept.
    if (/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/i.test(code)) {
      setSlug(code.toLowerCase());
      return;
    }
    setSlug("__invalid__");
  }, [code]);

  if (slug === "__invalid__") {
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
