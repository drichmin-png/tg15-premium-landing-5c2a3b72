import { createFileRoute } from "@tanstack/react-router";

// Cron endpoint: promotes paid orders from "preparando" to "a_caminho"
// after 4-6h WITHIN business hours (business_days + business_hour_start/end).
export const Route = createFileRoute("/api/public/hooks/tick-orders")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: settings } = await supabaseAdmin
          .from("admin_settings")
          .select("business_days, business_hour_start, business_hour_end")
          .eq("singleton", true)
          .maybeSingle();

        const businessDays: number[] = settings?.business_days ?? [1, 2, 3, 4, 5];
        const hourStart: number = settings?.business_hour_start ?? 9;
        const hourEnd: number = settings?.business_hour_end ?? 18;

        // Server time in São Paulo (UTC-3, no DST)
        const now = new Date(Date.now() - 3 * 3600_000);
        const dow = now.getUTCDay();
        const hour = now.getUTCHours();
        const inBusiness = businessDays.includes(dow) && hour >= hourStart && hour < hourEnd;

        if (!inBusiness) {
          return new Response(JSON.stringify({ skipped: "fora do expediente" }), { status: 200 });
        }

        const nowIso = new Date().toISOString();
        const fourHoursAgo = new Date(Date.now() - 4 * 3600_000).toISOString();

        // preparando -> a_caminho after 4h of paid_at
        const { data: promoted } = await supabaseAdmin
          .from("orders")
          .update({ status_rastreio: "a_caminho", rastreio_atualizado_em: nowIso })
          .eq("payment_status", "paid")
          .eq("status_rastreio", "preparando")
          .lt("paid_at", fourHoursAgo)
          .select("id");

        return new Response(
          JSON.stringify({ ok: true, promoted: promoted?.length ?? 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
