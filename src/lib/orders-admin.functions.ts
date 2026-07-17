import { createServerFn } from "@tanstack/react-start";

export type AdminOrder = {
  id: string;
  public_token: string;
  created_at: string;
  paid_at: string | null;
  payment_method: string;
  payment_status: string;
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
  delivery_status_override: string | null;
  invoice_url: string | null;
  notes: string;
  items: {
    id: string;
    variant_id: string;
    variant_name: string;
    quantity: number;
    unit_price_cents: number;
  }[];
};

export const listOrdersAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => input)
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PANEL_PASSWORD;
    if (!expected || data.password !== expected) {
      throw new Error("Senha inválida");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (orders ?? []).map((o) => o.id);
    let itemsByOrder: Record<string, AdminOrder["items"]> = {};
    if (ids.length) {
      const { data: items, error: iErr } = await supabaseAdmin
        .from("order_items")
        .select("*")
        .in("order_id", ids);
      if (iErr) throw new Error(iErr.message);
      for (const it of items ?? []) {
        (itemsByOrder[it.order_id] ||= []).push({
          id: it.id,
          variant_id: it.variant_id,
          variant_name: it.variant_name,
          quantity: it.quantity,
          unit_price_cents: it.unit_price_cents,
        });
      }
    }

    return (orders ?? []).map((o) => ({
      ...o,
      items: itemsByOrder[o.id] ?? [],
    })) as AdminOrder[];
  });

export const updateOrderStatusAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      password: string;
      orderId: string;
      payment_status?: string;
      delivery_status_override?: string | null;
      invoice_url?: string | null;
      notes?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PANEL_PASSWORD;
    if (!expected || data.password !== expected) {
      throw new Error("Senha inválida");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: {
      payment_status?: string;
      paid_at?: string;
      delivery_status_override?: string | null;
      invoice_url?: string | null;
      notes?: string;
    } = {};
    if (data.payment_status !== undefined) {
      patch.payment_status = data.payment_status;
      if (data.payment_status === "paid") patch.paid_at = new Date().toISOString();
    }
    if (data.delivery_status_override !== undefined)
      patch.delivery_status_override = data.delivery_status_override;
    if (data.invoice_url !== undefined) patch.invoice_url = data.invoice_url;
    if (data.notes !== undefined) patch.notes = data.notes;

    const { error } = await supabaseAdmin.from("orders").update(patch).eq("id", data.orderId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
