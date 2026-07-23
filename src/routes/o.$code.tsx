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
    // Preserve any ?setup= token attached to the short URL so that the operator can
    // bootstrap credentials on a fresh device the first time they open the link.
    const search = typeof window !== "undefined" ? window.location.search : "";
    const tenant = getLocalTenantByShortcode(code);
    if (tenant) {
      window.location.replace(`/app/${tenant.slug}/login${search}`);
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
