import { createServerFn } from "@tanstack/react-start";

export type PublicOrderInput = {
  public_token: string;
  payment_method: string;
  card_installments: number;
  total_cents: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_cpf: string;
  address_zip: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_district: string;
  address_city: string;
  address_state: string;
  notes: string;
  items: {
    variant_id: string;
    variant_name: string;
    quantity: number;
    unit_price_cents: number;
  }[];
};

/** Registra o pedido no servidor para que apareça no painel de qualquer dispositivo. */
export const createOrderPublic = createServerFn({ method: "POST" })
  .inputValidator((input: PublicOrderInput) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const existing = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("public_token", data.public_token)
      .maybeSingle();
    if (existing.data?.id) return { ok: true, id: existing.data.id, duplicated: true };

    const { items, ...order } = data;
    const { data: inserted, error } = await supabaseAdmin
      .from("orders")
      .insert({ ...order, payment_status: "pending" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (items.length) {
      const { error: iErr } = await supabaseAdmin
        .from("order_items")
        .insert(items.map((it) => ({ ...it, order_id: inserted.id })));
      if (iErr) throw new Error(iErr.message);
    }

    return { ok: true, id: inserted.id, duplicated: false };
  });

/** Busca um pedido pelo token público (usado na tela de conclusão do cliente). */
export const getOrderByToken = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("public_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    return { ...order, items: items ?? [] };
  });
