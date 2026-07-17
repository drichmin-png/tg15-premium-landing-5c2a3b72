// Standard normalized payload every adapter must return
export type NormalizedStatus =
  | "pago"
  | "aguardando"
  | "recusado"
  | "cancelado"
  | "reembolsado"
  | "chargeback"
  | "em_disputa";

export type NormalizedWebhook = {
  pedido_id: string;
  status: NormalizedStatus;
  valor: number; // cents
  metodo_pagamento: "pix" | "cartao" | "outro";
  parcelas: number;
  gateway_origem: string;
  gateway_charge_id?: string;
};

export type GatewayCredentials = {
  id: string;
  nome: string;
  tipo: "ironpay" | "pagarme" | "mercadopago" | "outro";
  chave_publica: string;
  chave_secreta: string;
  webhook_secret: string;
  tipo_chave_pix: string;
  chave_pix: string;
};

export type PixChargeInput = {
  orderId: string;
  amountCents: number;
  customer: { name: string; email: string; document: string; phone?: string };
};

export type PixChargeResult = {
  chargeId: string;
  brCode: string; // "copia e cola"
  qrCodeImage?: string; // base64 or url
  expiresAt?: string;
};

export type CardChargeInput = PixChargeInput & {
  installments: number;
  card: { number: string; holder: string; expMonth: string; expYear: string; cvv: string };
};

export type CardChargeResult = {
  chargeId: string;
  status: NormalizedStatus;
};

export interface GatewayAdapter {
  tipo: GatewayCredentials["tipo"];
  verifySignature(rawBody: string, headers: Headers, cred: GatewayCredentials): boolean;
  parseWebhook(payload: unknown, cred: GatewayCredentials): NormalizedWebhook | null;
  createPixCharge?(input: PixChargeInput, cred: GatewayCredentials): Promise<PixChargeResult>;
  createCardCharge?(input: CardChargeInput, cred: GatewayCredentials): Promise<CardChargeResult>;
}
