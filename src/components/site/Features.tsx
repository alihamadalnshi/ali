import { motion } from "framer-motion";
import { Wand2, Zap, ImagePlus, Sparkles, Bot, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "./SectionHeader";

const getFeatures = (t: any) => [
  { icon: Wand2, title: t('feat_1_title'), desc: t('feat_1_desc') },
  { icon: Bot, title: t('feat_2_title'), desc: t('feat_2_desc') },
  { icon: Sparkles, title: t('feat_3_title'), desc: t('feat_3_desc') },
  { icon: Zap, title: t('feat_4_title'), desc: t('feat_4_desc') },
  { icon: ImagePlus, title: t('feat_5_title'), desc: t('feat_5_desc') },
  { icon: ShieldCheck, title: t('feat_6_title'), desc: t('feat_6_desc') },
];

export function Features() {
  const { t } = useTranslation();
  const features = getFeatures(t);
  
  return (
    <section id="features" className="relative py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t('feat_eyebrow')}
          title={t('feat_title')}
          description={t('feat_desc')}
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="ring-border-gradient group glass relative overflow-hidden rounded-2xl p-6 transition-colors hover:bg-white/[0.04]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-5 text-base font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
