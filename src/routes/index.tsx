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

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <TrustBar />

        <section id="produto" className="container-x mt-24">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <ProductGallery />
            <BuyPanel />
          </div>
        </section>

        <Benefits />
        <DosageTable />
        <VideoSection />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
