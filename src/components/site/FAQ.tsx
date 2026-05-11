import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "./SectionHeader";

const getFaqs = (t: any) => [
  { q: t('faq_1_q'), a: t('faq_1_a') },
  { q: t('faq_2_q'), a: t('faq_2_a') },
  { q: t('faq_3_q'), a: t('faq_3_a') },
  { q: t('faq_4_q'), a: t('faq_4_a') },
  { q: t('faq_5_q'), a: t('faq_5_a') },
];

export function FAQ() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(0);
  const faqs = getFaqs(t);
  return (
    <section id="faq" className="relative py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeader eyebrow={t('faq_eyebrow')} title={t('faq_title')} />

        <div className="mt-12 divide-y divide-white/5 ring-border-gradient glass rounded-2xl">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <button
                key={f.q}
                onClick={() => setOpen(isOpen ? null : i)}
                className="block w-full text-left"
              >
                <div className="flex items-center justify-between gap-4 px-6 py-5">
                  <p className="text-sm font-medium sm:text-base">{f.q}</p>
                  <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className="text-muted-foreground">
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm text-muted-foreground">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
