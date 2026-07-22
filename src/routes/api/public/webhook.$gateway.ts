import { createFileRoute } from "@tanstack/react-router";

// Local-only mode: webhooks are disabled until the backend integration returns.
export const Route = createFileRoute("/api/public/webhook/$gateway")({
  server: {
    handlers: {
      POST: async () =>
        new Response(
          JSON.stringify({ ok: false, error: "Webhooks disabled in local mode" }),
          { status: 503, headers: { "content-type": "application/json" } },
        ),
    },
  },
});
