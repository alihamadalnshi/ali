import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

export function CTA() {
  const { t } = useTranslation();
  return (
    <section id="cta" className="relative overflow-hidden py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute inset-0 grid-bg opacity-30" />
      </div>
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          <span className="text-gradient">{t('cta_title_1')}</span>
          <br />
          <span className="text-gradient-accent">{t('cta_title_2')}</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg"
        >
          {t('cta_desc')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a
            href="#"
            className="group inline-flex items-center gap-2 rounded-xl bg-accent-gradient px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
          >
            {t('cta_btn_1')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:rtl:-translate-x-0.5 group-hover:ltr:translate-x-0.5 rtl:rotate-180" />
          </a>
        </motion.div>
        <p className="mt-4 text-xs text-muted-foreground">{t('cta_no_cc')}</p>
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <p className="text-xs text-muted-foreground">{t('footer_copy')}</p>
        <div className="flex gap-5 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">{t('footer_privacy')}</Link>
          <Link to="/terms" className="hover:text-foreground">{t('footer_terms')}</Link>
          <Link to="/refund" className="hover:text-foreground">{t('refund_title')}</Link>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-foreground">{t('footer_twitter')}</a>
        </div>
      </div>
    </footer>
  );
}
