import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getLocalTenantByShortcode } from "@/lib/saas-local";

export const Route = createFileRoute("/o/$code")({
  head: () => ({ meta: [{ title: "Painel do operador" }, { name: "robots", content: "noindex" }] }),
  component: OperatorShortRedirect,
});

function OperatorShortRedirect() {
  const { code } = Route.useParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const tenant = getLocalTenantByShortcode(code);
    if (tenant) {
      window.location.replace(`/app/${tenant.slug}/login${search}`);
      return;
    }
    // Fallback: shortcode não existe neste dispositivo — tenta usar o código como slug.
    if (/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/i.test(code)) {
      window.location.replace(`/app/${code.toLowerCase()}/login${search}`);
      return;
    }
    setError("Link inválido ou operador não encontrado neste dispositivo.");
  }, [code]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-sm font-semibold text-ink">
        {error ?? "Redirecionando para o painel do operador..."}
      </div>
      {error && (
        <a href="/" className="text-xs text-primary underline">
          Voltar para o início
        </a>
      )}
    </main>
  );
}
