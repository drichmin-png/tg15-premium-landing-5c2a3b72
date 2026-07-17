import { createHmac, timingSafeEqual } from "crypto";
import type { GatewayAdapter, NormalizedStatus, NormalizedWebhook } from "../types";

// Map IronPay status labels → internal normalized status
function mapStatus(raw: string): NormalizedStatus | null {
  const s = (raw || "").toString().trim().toLowerCase();
  if (["pago", "paid", "approved", "aprovado"].includes(s)) return "pago";
  if (["aguardando pagamento", "aguardando", "pending", "waiting", "em processamento", "em analise", "em análise", "processing"].includes(s))
    return "aguardando";
  if (["recusado", "refused", "denied", "barrado pelo antifraude", "antifraude", "falha", "failed", "nao pago", "não pago"].includes(s))
    return "recusado";
  if (["cancelado", "canceled", "cancelled"].includes(s)) return "cancelado";
  if (["reembolsado", "refunded"].includes(s)) return "reembolsado";
  if (["chargeback", "pre chargeback", "pré chargeback", "pre-chargeback"].includes(s)) return "chargeback";
  if (["em disputa", "disputed", "dispute"].includes(s)) return "em_disputa";
  return null;
}

export const ironpayAdapter: GatewayAdapter = {
  tipo: "ironpay",

  verifySignature(rawBody, headers, cred) {
    const secret = cred.webhook_secret || cred.chave_secreta;
    if (!secret) return true; // fail-open when not configured yet — logged as false
    const sig = headers.get("x-ironpay-signature") ?? headers.get("x-signature") ?? "";
    if (!sig) return false;
    try {
      const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
      const a = Buffer.from(sig.replace(/^sha256=/, ""));
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  },

  parseWebhook(payload): NormalizedWebhook | null {
    const p = (payload ?? {}) as Record<string, any>;
    const data = (p.data ?? p.transaction ?? p) as Record<string, any>;
    const externalId =
      data.external_id ?? data.order_id ?? data.reference ?? data.metadata?.order_id ?? p.external_id;
    const statusRaw = data.status ?? p.status ?? "";
    const status = mapStatus(statusRaw);
    if (!externalId || !status) return null;

    const amount = Number(data.amount ?? data.value ?? p.amount ?? 0);
    const valorCents = Number.isFinite(amount)
      ? amount < 1000
        ? Math.round(amount * 100)
        : Math.round(amount)
      : 0;

    const method = String(data.payment_method ?? data.method ?? p.payment_method ?? "").toLowerCase();
    const metodo: NormalizedWebhook["metodo_pagamento"] = method.includes("pix")
      ? "pix"
      : method.includes("card") || method.includes("credit") || method.includes("cartao")
      ? "cartao"
      : "outro";

    return {
      pedido_id: String(externalId),
      status,
      valor: valorCents,
      metodo_pagamento: metodo,
      parcelas: Number(data.installments ?? p.installments ?? 1) || 1,
      gateway_origem: "ironpay",
      gateway_charge_id: String(data.id ?? p.id ?? ""),
    };
  },
};
