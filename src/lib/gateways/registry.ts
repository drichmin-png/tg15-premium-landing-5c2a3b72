import type { GatewayAdapter } from "./types";
import { ironpayAdapter } from "./adapters/ironpay";

const adapters: Record<string, GatewayAdapter> = {
  ironpay: ironpayAdapter,
};

export function getAdapter(tipo: string): GatewayAdapter | null {
  return adapters[tipo] ?? null;
}
