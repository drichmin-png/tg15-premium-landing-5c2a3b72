import { createFileRoute } from "@tanstack/react-router";

// Local-only mode: order tick job disabled until the backend integration returns.
export const Route = createFileRoute("/api/public/hooks/tick-orders")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify({ ok: true, skipped: true }), {
          headers: { "content-type": "application/json" },
        }),
    },
  },
});
