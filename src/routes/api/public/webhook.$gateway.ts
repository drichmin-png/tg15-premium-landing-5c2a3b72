import { createFileRoute } from "@tanstack/react-router";
import { getAdapter } from "@/lib/gateways/registry";
import type { GatewayCredentials } from "@/lib/gateways/types";
import type { TablesUpdate } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/webhook/$gateway")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const gatewayTipo = String(params.gateway || "").toLowerCase();
        const rawBody = await request.text();
        let payload: unknown = {};
        try {
          payload = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          payload = { _raw: rawBody };
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Look up credentials for this gateway type (prefer default+ativo)
        const { data: gateways } = await supabaseAdmin
          .from("gateways")
          .select("*")
          .eq("tipo", gatewayTipo as GatewayCredentials["tipo"])
          .eq("ativo", true)
          .order("padrao", { ascending: false })
          .order("prioridade", { ascending: true })
          .limit(1);
        const cred = (gateways?.[0] as GatewayCredentials | undefined) ?? {
          id: "",
          nome: "",
          tipo: gatewayTipo as GatewayCredentials["tipo"],
          chave_publica: "",
          chave_secreta: "",
          webhook_secret: "",
          tipo_chave_pix: "",
          chave_pix: "",
        };

        const adapter = getAdapter(gatewayTipo);
        let assinaturaValida = false;
        let sucesso = false;
        let erro: string | null = null;
        let pedidoUuid: string | null = null;

        try {
          if (!adapter) throw new Error(`Gateway "${gatewayTipo}" não suportado`);
          assinaturaValida = adapter.verifySignature(rawBody, request.headers, cred);
          if (!assinaturaValida) throw new Error("Assinatura inválida");

          const normalized = adapter.parseWebhook(payload, cred);
          if (!normalized) throw new Error("Payload inválido ou status desconhecido");

          // Locate order via safe parameterized lookups. Validate the incoming id
          // shape first so a crafted value can't smuggle PostgREST filter syntax.
          const rawId = String(normalized.pedido_id ?? "").trim();
          const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const PUBLIC_TOKEN_RE = /^[0-9a-f]{16,64}$/i;
          if (!rawId || (!UUID_RE.test(rawId) && !PUBLIC_TOKEN_RE.test(rawId))) {
            throw new Error("Identificador de pedido em formato inválido");
          }

          let orderById: Awaited<
            ReturnType<typeof supabaseAdmin.from<"orders">>
          > extends never
            ? never
            : any = null;
          if (UUID_RE.test(rawId)) {
            const { data } = await supabaseAdmin
              .from("orders")
              .select("*")
              .eq("id", rawId)
              .maybeSingle();
            orderById = data ?? null;
          }
          if (!orderById) {
            const { data } = await supabaseAdmin
              .from("orders")
              .select("*")
              .eq("public_token", rawId)
              .maybeSingle();
            orderById = data ?? null;
          }

          if (!orderById) throw new Error(`Pedido ${rawId} não encontrado`);
          pedidoUuid = orderById.id;

          const patch: TablesUpdate<"orders"> = {
            gateway_utilizado: normalized.gateway_origem,
            gateway_charge_id: normalized.gateway_charge_id ?? null,
          };

          if (normalized.status === "pago") {
            patch.payment_status = "paid";
            patch.paid_at = new Date().toISOString();
            patch.status_rastreio = "preparando";
            patch.rastreio_atualizado_em = new Date().toISOString();
          } else if (normalized.status === "recusado" || normalized.status === "cancelado") {
            patch.payment_status = "canceled";
          } else if (normalized.status === "reembolsado") {
            patch.payment_status = "refunded";
          } else if (normalized.status === "chargeback" || normalized.status === "em_disputa") {
            patch.payment_status = "chargeback";
            patch.chargeback_flag = true;
          } else {
            patch.payment_status = "pending";
          }

          const { error: updErr } = await supabaseAdmin
            .from("orders")
            .update(patch)
            .eq("id", orderById.id);
          if (updErr) throw new Error(updErr.message);

          // Fire conversion events on paid
          if (normalized.status === "pago") {
            const { data: settings } = await supabaseAdmin
              .from("admin_settings")
              .select("facebook_pixel_id, facebook_capi_token, utmify_api_key")
              .eq("singleton", true)
              .maybeSingle();
            const { fireFacebookPurchase, fireUtmifySale } = await import(
              "@/lib/tracking/server-events.server"
            );
            const utm = {
              source: orderById.utm_source ?? undefined,
              medium: orderById.utm_medium ?? undefined,
              campaign: orderById.utm_campaign ?? undefined,
              content: orderById.utm_content ?? undefined,
              term: orderById.utm_term ?? undefined,
            };
            await Promise.all([
              fireFacebookPurchase({
                pixelId: settings?.facebook_pixel_id ?? "",
                accessToken: settings?.facebook_capi_token ?? "",
                orderId: orderById.id,
                valueCents: orderById.total_cents,
                email: orderById.customer_email,
                phone: orderById.customer_phone,
                utm,
              }),
              fireUtmifySale({
                apiKey: settings?.utmify_api_key ?? "",
                orderId: orderById.id,
                valueCents: orderById.total_cents,
                customer: {
                  name: orderById.customer_name,
                  email: orderById.customer_email,
                  phone: orderById.customer_phone,
                  document: orderById.customer_cpf,
                },
                utm,
              }),
            ]);
          }

          sucesso = true;
        } catch (e) {
          erro = (e as Error).message;
        }

        // Always log, always respond 200
        try {
          await supabaseAdmin.from("webhook_logs").insert({
            gateway_tipo: gatewayTipo,
            pedido_id: pedidoUuid,
            payload: payload as never,
            assinatura_valida: assinaturaValida,
            sucesso,
            erro,
          });
        } catch {
          /* swallow logging errors */
        }

        return new Response(JSON.stringify({ received: true, ok: sucesso, error: erro }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
