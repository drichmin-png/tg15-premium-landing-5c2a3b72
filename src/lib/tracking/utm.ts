export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

const KEYS: (keyof UtmParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

const STORAGE_KEY = "tg15-utm-first-touch";

export function readUtmFromUrl(): UtmParams {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const out: UtmParams = {};
  for (const k of KEYS) {
    const v = sp.get(k);
    if (v) out[k] = v;
  }
  return out;
}

export function getStoredUtm(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UtmParams;
  } catch {
    return {};
  }
}

/** First-touch: only stores if nothing is stored yet. */
export function captureUtmFirstTouch(): UtmParams {
  if (typeof window === "undefined") return {};
  const existing = getStoredUtm();
  if (existing && Object.keys(existing).length > 0) return existing;
  const fresh = readUtmFromUrl();
  if (Object.keys(fresh).length === 0) return {};
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    /* ignore */
  }
  return fresh;
}

export function utmToQueryString(utm: UtmParams): string {
  const sp = new URLSearchParams();
  for (const k of KEYS) {
    const v = utm[k];
    if (v) sp.set(k, v);
  }
  return sp.toString();
}

/** Append stored UTMs to a URL if not already present. */
export function appendUtmToUrl(url: string, utm?: UtmParams): string {
  const params = utm ?? getStoredUtm();
  const qs = utmToQueryString(params);
  if (!qs) return url;
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    for (const [k, v] of new URLSearchParams(qs)) {
      if (!u.searchParams.has(k)) u.searchParams.set(k, v);
    }
    // preserve relative vs absolute
    if (/^https?:\/\//i.test(url)) return u.toString();
    return u.pathname + (u.search ? u.search : "") + (u.hash || "");
  } catch {
    return url + (url.includes("?") ? "&" : "?") + qs;
  }
}
