import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/create")({
  component: CreateAd,
  head: () => ({
    meta: [
      { title: "Create New Ad — نماذج Ai" },
      { name: "description", content: "Create a new AI-generated ad creative." },
    ],
  }),
});

function CreateAd() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight text-gradient"
        >
          {t("dash_create_title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-sm text-muted-foreground"
        >
          {t("dash_create_desc")}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-3xl ring-border-gradient glass-strong p-10 text-center"
      >
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-[500px] rounded-full bg-primary/20 blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow mb-6">
            <Sparkles className="h-9 w-9 text-primary-foreground" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-3">
            {t("dash_create_cta_title")}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
            {t("dash_create_cta_desc")}
          </p>

          <Link
            to="/"
            hash="templates"
            className="group inline-flex items-center gap-2.5 rounded-xl bg-accent-gradient px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_var(--glow)]"
          >
            {t("dash_create_cta_btn")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <p className="mt-4 text-[11px] text-muted-foreground/60">
            {t("dash_create_cta_hint")}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { step: "01", titleKey: "dash_create_step1", descKey: "dash_create_step1_desc" },
          { step: "02", titleKey: "dash_create_step2", descKey: "dash_create_step2_desc" },
          { step: "03", titleKey: "dash_create_step3", descKey: "dash_create_step3_desc" },
        ].map((item, i) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="rounded-2xl glass p-6 ring-border-gradient"
          >
            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-2.5 py-1 rounded-md mb-3">
              {t("dash_create_step")} {item.step}
            </span>
            <h3 className="text-sm font-semibold text-foreground mb-1">{t(item.titleKey)}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
