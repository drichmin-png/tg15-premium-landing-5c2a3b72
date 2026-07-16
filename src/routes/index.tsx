import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { TrustBar } from "@/components/site/TrustBar";
import { ProductGallery } from "@/components/site/ProductGallery";
import { BuyPanel } from "@/components/site/BuyPanel";
import { Benefits } from "@/components/site/Benefits";
import { DosageTable } from "@/components/site/DosageTable";
import { VideoSection } from "@/components/site/VideoSection";
import { FAQ } from "@/components/site/FAQ";
import { useAdmin, type BlockId } from "@/lib/admin-store";
import { TrackingScripts } from "@/components/site/TrackingScripts";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const s = useAdmin();

  const renderers: Record<BlockId, () => JSX.Element> = {
    hero: () => <Hero />,
    trust: () => <TrustBar />,
    produto: () => (
      <section id="produto" className="container-x mt-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <ProductGallery />
          <BuyPanel />
        </div>
      </section>
    ),
    beneficios: () => <Benefits />,
    dosagem: () => <DosageTable />,
    videos: () => <VideoSection />,
    faq: () => <FAQ />,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TrackingScripts />
      <Header />
      <main>
        {s.blocks
          .filter((b) => b.visible)
          .map((b) => (
            <div key={b.id}>{renderers[b.id]()}</div>
          ))}
      </main>
      <Footer />
    </div>
  );
}
