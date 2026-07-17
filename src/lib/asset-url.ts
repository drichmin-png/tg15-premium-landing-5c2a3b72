// Resolve Lovable CDN asset paths to absolute URLs so they work on any host
// (Vercel, custom domains, etc.), not only on the Lovable-managed infrastructure
// that serves `/__l5e/*` directly.
//
// Set VITE_ASSET_BASE_URL in your deployment env if you use a different origin
// (e.g. a custom domain that already proxies /__l5e/).
const DEFAULT_BASE = "https://tg15-premium-landing.lovable.app";

const BASE = (import.meta.env.VITE_ASSET_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");

export function assetUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/__l5e/")) return `${BASE}${url}`;
  return url;
}
