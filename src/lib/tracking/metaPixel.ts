import { getStoredUtm } from "./utm";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

let initialized = false;
let currentPixelId: string | null = null;

function loadPixelScript() {
  if (typeof window === "undefined") return;
  if (document.getElementById("fb-pixel-base")) return;
  const s = document.createElement("script");
  s.id = "fb-pixel-base";
  s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');`;
  document.head.appendChild(s);
}

export function initMetaPixel(pixelId: string) {
  if (typeof window === "undefined") return;
  if (!pixelId) return;
  if (initialized && currentPixelId === pixelId) return;
  loadPixelScript();
  if (!window.fbq) return;
  if (!initialized) {
    window.fbq("init", pixelId);
    initialized = true;
    currentPixelId = pixelId;
    pageView();
  } else if (currentPixelId !== pixelId) {
    window.fbq("init", pixelId);
    currentPixelId = pixelId;
  }
}

export function isPixelReady() {
  return initialized && typeof window !== "undefined" && !!window.fbq;
}

function eventId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fallthrough */
  }
  return "ev_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}

type BaseParams = Record<string, unknown>;

function track(name: string, params: BaseParams = {}) {
  if (typeof window === "undefined" || !window.fbq) return { event_id: "" };
  const id = eventId();
  const utm = getStoredUtm();
  window.fbq("track", name, { ...utm, ...params }, { eventID: id });
  return { event_id: id };
}

export function pageView() {
  return track("PageView");
}

export function trackLead(params: BaseParams = {}) {
  return track("Lead", params);
}

export function trackAddToCart(params: {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
} = {}) {
  return track("AddToCart", { currency: "BRL", ...params });
}

export function trackInitiateCheckout(params: {
  value?: number;
  currency?: string;
  num_items?: number;
  content_ids?: string[];
} = {}) {
  return track("InitiateCheckout", { currency: "BRL", ...params });
}

export function trackAddPaymentInfo(params: {
  value?: number;
  currency?: string;
  content_ids?: string[];
} = {}) {
  return track("AddPaymentInfo", { currency: "BRL", ...params });
}

export function trackPurchase(params: {
  value: number;
  currency?: string;
  content_ids?: string[];
  num_items?: number;
  order_id?: string;
}) {
  return track("Purchase", { currency: "BRL", ...params });
}
