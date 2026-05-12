import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { TemplateGallery } from "@/components/site/TemplateGallery";
import { Footer } from "@/components/site/CTA";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "نماذج Ai — Turn any product into stunning AI ads in seconds" },
      {
        name: "description",
        content:
          "Upload your product, choose a template, and instantly generate professional AI marketing creatives. No prompts, no designers.",
      },
      { property: "og:title", content: "نماذج Ai — AI Ads in Seconds" },
      {
        property: "og:description",
        content: "Studio-quality ads, on autopilot. Trusted by 12,000+ modern brands.",
      },
    ],
  }),
});

function Index() {
  return (
    <main id="top" className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <TemplateGallery />
      <Footer />
    </main>
  );
}
