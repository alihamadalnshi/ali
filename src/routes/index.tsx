import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { TemplateGallery } from "@/components/site/TemplateGallery";
import { Pricing } from "@/components/site/Pricing";
import { Footer } from "@/components/site/CTA";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      toast.success(t("settings_payment_success"));
      // Clean the URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [t]);

  if (loading) {
    return null;
  }

  return (
    <main id="top" className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <TemplateGallery />
      <Pricing />
      <Footer />
    </main>
  );
}
