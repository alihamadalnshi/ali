import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { TemplateGallery } from "@/components/site/TemplateGallery";
import { UploadShowcase } from "@/components/site/UploadShowcase";
import { Features } from "@/components/site/Features";
import { Trust } from "@/components/site/Trust";
import { Pricing } from "@/components/site/Pricing";
import { FAQ } from "@/components/site/FAQ";
import { CTA, Footer } from "@/components/site/CTA";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Lumen — Turn any product into stunning AI ads in seconds" },
      {
        name: "description",
        content:
          "Upload your product, choose a template, and instantly generate professional AI marketing creatives. No prompts, no designers.",
      },
      { property: "og:title", content: "Lumen — AI Ads in Seconds" },
      {
        property: "og:description",
        content: "Studio-quality ads, on autopilot. Trusted by 12,000+ modern brands.",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <Hero />
      <TemplateGallery />
      <UploadShowcase />
      <Features />
      <Trust />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
