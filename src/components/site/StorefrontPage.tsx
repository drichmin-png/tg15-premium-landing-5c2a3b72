import * as React from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { TrustBar } from "@/components/site/TrustBar";
import { ProductGallery } from "@/components/site/ProductGallery";
import { BuyPanel } from "@/components/site/BuyPanel";
import { Benefits } from "@/components/site/Benefits";
import { DosageTable } from "@/components/site/DosageTable";
import { Reviews } from "@/components/site/Reviews";
import { VideoSection } from "@/components/site/VideoSection";
import { FAQ } from "@/components/site/FAQ";
import { TrackingScripts } from "@/components/site/TrackingScripts";
import { admin, useAdmin, type BlockId } from "@/lib/admin-store";
import { observeSection, track } from "@/lib/analytics/tracker";

const ACTIVE_OPERATOR_KEY = "tg15-active-operator-slug";

function TrackedBlock({ name, children }: { name: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => observeSection(ref.current, name), [name]);
  return (
    <div ref={ref} data-section={name}>
      {children}
    </div>
  );
}

export function StorefrontPage({ operatorSlug }: { operatorSlug?: string }) {
  const [ready, setReady] = React.useState(!operatorSlug);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (operatorSlug) {
      const slug = operatorSlug.trim().toLowerCase();
      const setupToken = new URLSearchParams(window.location.search).get("store");
      admin.setNamespace(slug);
      window.sessionStorage.setItem(ACTIVE_OPERATOR_KEY, slug);
      if (setupToken) {
        admin.importStorefrontConfig(slug, setupToken);
        setReady(true);
      } else {
        admin.hydrateRemote(slug).finally(() => setReady(true));
      }
      return;
    }

    admin.setNamespace(null);
    window.sessionStorage.removeItem(ACTIVE_OPERATOR_KEY);
    admin.hydrateRemote(null).finally(() => setReady(true));
  }, [operatorSlug]);

  const s = useAdmin();

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest("a,button,[data-track]") as HTMLElement | null;
      if (!el) return;
      const label =
        el.getAttribute("data-track") ||
        el.getAttribute("aria-label") ||
        (el as HTMLAnchorElement).textContent?.trim().slice(0, 60) ||
        el.tagName.toLowerCase();
      const href = (el as HTMLAnchorElement).href;
      track("click", { target: label, meta: href ? { href } : {} });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  const renderers: Record<BlockId, () => React.ReactElement> = {
    hero: () => <Hero />,
    trust: () => <TrustBar />,
    produto: () => (
      <>
        <section id="produto" className="container-x mt-16">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <ProductGallery />
            <BuyPanel />
          </div>
        </section>
        <Reviews />
      </>
    ),
    beneficios: () => <Benefits />,
    dosagem: () => <DosageTable />,
    videos: () => <VideoSection />,
    faq: () => <FAQ />,
  };

  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TrackingScripts />
      <Header />
      <main>
        {s.blocks
          .filter((b) => b.visible)
          .map((b) => (
            <TrackedBlock key={b.id} name={b.id}>
              {renderers[b.id]()}
            </TrackedBlock>
          ))}
      </main>
      <Footer />
    </div>
  );
}
