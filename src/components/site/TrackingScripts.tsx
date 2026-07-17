import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAdmin } from "@/lib/admin-store";
import { initMetaPixel, pageView } from "@/lib/tracking/metaPixel";
import { captureUtmFirstTouch } from "@/lib/tracking/utm";

/**
 * Injects tracking scripts and handles SPA-safe PageView on route changes.
 * - Meta Pixel: initialized via metaPixel.ts, PageView fires on every route change.
 * - GA4 + TikTok Pixel: base script injection.
 */
export function TrackingScripts() {
  const { tracking } = useAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // capture UTMs on first load (first-touch)
  useEffect(() => {
    captureUtmFirstTouch();
  }, []);

  // init Meta Pixel when id/active changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!tracking.active) return;
    if (tracking.facebookPixelId) initMetaPixel(tracking.facebookPixelId);
  }, [tracking.active, tracking.facebookPixelId]);

  // SPA-safe PageView on route change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!tracking.active) return;
    if (!tracking.facebookPixelId) return;
    pageView();
  }, [pathname, tracking.active, tracking.facebookPixelId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!tracking.active) return;

    // Google Analytics (GA4)
    if (tracking.googleAnalyticsId && !document.getElementById("ga4")) {
      const l = document.createElement("script");
      l.id = "ga4";
      l.async = true;
      l.src = `https://www.googletagmanager.com/gtag/js?id=${tracking.googleAnalyticsId}`;
      document.head.appendChild(l);

      const c = document.createElement("script");
      c.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${tracking.googleAnalyticsId}');
      `;
      document.head.appendChild(c);
    }

    // TikTok Pixel
    if (tracking.tiktokPixelId && !document.getElementById("tt-pixel")) {
      const s = document.createElement("script");
      s.id = "tt-pixel";
      s.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${tracking.tiktokPixelId}');
          ttq.page();
        }(window, document, 'ttq');
      `;
      document.head.appendChild(s);
    }
  }, [tracking.active, tracking.googleAnalyticsId, tracking.tiktokPixelId]);

  return null;
}
