import { useSyncExternalStore } from "react";
import type { VariantId } from "./product";

type State = {
  variant: VariantId;
  qty: number;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    cpf: string;
  };
  address: {
    zip: string;
    street: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
  };
  shipping: "standard" | "express" | "";
  payment: "pix" | "card" | "boleto" | "";
};

const initial: State = {
  variant: "box",
  qty: 1,
  customer: { fullName: "", email: "", phone: "", cpf: "" },
  address: { zip: "", street: "", number: "", complement: "", district: "", city: "", state: "" },
  shipping: "",
  payment: "",
};

let state: State = initial;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const cart = {
  get: () => state,
  set: (patch: Partial<State>) => {
    state = { ...state, ...patch };
    notify();
  },
  patch: <K extends keyof State>(k: K, v: Partial<State[K]>) => {
    state = { ...state, [k]: { ...(state[k] as object), ...(v as object) } } as State;
    notify();
  },
  setVariant: (variant: VariantId) => {
    state = { ...state, variant };
    notify();
  },
  setQty: (qty: number) => {
    state = { ...state, qty: Math.max(1, Math.min(20, qty)) };
    notify();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useCart() {
  return useSyncExternalStore(
    cart.subscribe,
    () => state,
    () => initial,
  );
}
