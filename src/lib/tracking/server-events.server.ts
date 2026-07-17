import { createHash } from "crypto";

function sha256(v: string) {
  return createHash("sha256").update(v.trim().toLowerCase()).digest("hex");
}

export async function fireFacebookPurchase(params: {
  pixelId: string;
  accessToken: string;
  orderId: string;
  valueCents: number;
  email?: string;
  phone?: string;
  utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string };
}) {
  const { pixelId, accessToken, orderId, valueCents, email, phone } = params;
  if (!pixelId || !accessToken) return { skipped: true };
  const url = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;
  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: orderId,
        user_data: {
          em: email ? [sha256(email)] : undefined,
          ph: phone ? [sha256(phone.replace(/\D/g, ""))] : undefined,
        },
        custom_data: {
          currency: "BRL",
          value: valueCents / 100,
          order_id: orderId,
        },
      },
    ],
  };
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function fireUtmifySale(params: {
  apiKey: string;
  orderId: string;
  valueCents: number;
  customer: { name: string; email: string; phone?: string; document?: string };
  utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string };
}) {
  const { apiKey, orderId, valueCents, customer, utm } = params;
  if (!apiKey) return { skipped: true };
  try {
    const r = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-token": apiKey },
      body: JSON.stringify({
        orderId,
        platform: "TG15",
        paymentMethod: "pix",
        status: "paid",
        createdAt: new Date().toISOString(),
        approvedDate: new Date().toISOString(),
        customer,
        products: [{ id: orderId, name: "T.G.15", quantity: 1, priceInCents: valueCents }],
        trackingParameters: {
          utm_source: utm?.source ?? null,
          utm_medium: utm?.medium ?? null,
          utm_campaign: utm?.campaign ?? null,
          utm_content: utm?.content ?? null,
          utm_term: utm?.term ?? null,
        },
        commission: { totalPriceInCents: valueCents, gatewayFeeInCents: 0, userCommissionInCents: valueCents },
      }),
    });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
