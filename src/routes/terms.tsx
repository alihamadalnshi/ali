import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/CTA";
import { useTranslation } from "react-i18next";
import { Scale } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — نماذج Ai" },
      { name: "description", content: "Terms of Service for Namadhij AI" },
    ],
  }),
});

function TermsPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-24 sm:px-6 mt-10" dir={isRtl ? "rtl" : "ltr"}>
          {/* Header */}
          <div className="text-center mb-16 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_15px_var(--glow)] ring-1 ring-primary/40 mb-4">
              <Scale className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-gradient">
              {t("terms_title")}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              {t("login_powered_by")}
            </p>
          </div>

          {/* Content */}
          <div className="glass border border-white/5 p-8 sm:p-12 rounded-3xl space-y-10 leading-relaxed text-sm sm:text-base">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gradient-accent">
                1. {t("terms_section_agreement_title")}
              </h2>
              <p className="text-muted-foreground">{t("terms_section_agreement_desc")}</p>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gradient-accent">
                2. {t("terms_section_proprietary_title")}
              </h2>
              <p className="text-muted-foreground">{t("terms_section_proprietary_desc")}</p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gradient-accent">
                3. {t("terms_section_disclaimer_title")}
              </h2>
              <p className="text-muted-foreground">{t("terms_section_disclaimer_desc")}</p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gradient-accent">
                4. {t("terms_section_updates_title")}
              </h2>
              <p className="text-muted-foreground">{t("terms_section_updates_desc")}</p>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
