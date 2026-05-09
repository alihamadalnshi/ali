import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import { SectionHeader } from "./SectionHeader";

const tiers = [
  {
    name: "Starter",
    monthly: 19,
    yearly: 15,
    desc: "For founders shipping their first ads.",
    features: ["50 generations / mo", "All templates", "HD downloads", "Email support"],
  },
  {
    name: "Studio",
    monthly: 59,
    yearly: 49,
    desc: "For growth teams scaling creative.",
    featured: true,
    features: [
      "500 generations / mo",
      "4K downloads",
      "Brand kits & presets",
      "Priority rendering",
      "Team workspace (5 seats)",
    ],
  },
  {
    name: "Scale",
    monthly: 199,
    yearly: 169,
    desc: "Unlimited creative for ecommerce ops.",
    features: ["Unlimited generations", "API access", "Custom templates", "Dedicated SLA"],
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(true);
  return (
    <section id="pricing" className="relative py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Pricing"
          title="Simple plans. Wild outcomes."
          description="Start free. Upgrade when ads start printing money."
        />

        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            className="relative h-6 w-11 rounded-full bg-white/10"
            aria-label="Toggle billing"
          >
            <motion.span
              animate={{ x: yearly ? 22 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 h-4 w-4 rounded-full bg-accent-gradient shadow-glow"
            />
          </button>
          <span className={`text-sm ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Yearly <span className="text-xs text-primary">−20%</span>
          </span>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className={`ring-border-gradient relative rounded-3xl p-7 ${
                t.featured
                  ? "glass-strong shadow-glow"
                  : "glass"
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-gradient px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary-foreground">
                  Most popular
                </span>
              )}
              <p className="text-sm text-muted-foreground">{t.name}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-semibold tracking-tight text-gradient">
                  ${yearly ? t.yearly : t.monthly}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>

              <a
                href="#cta"
                className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-transform hover:scale-[1.01] ${
                  t.featured
                    ? "bg-accent-gradient text-primary-foreground shadow-glow"
                    : "bg-foreground text-background"
                }`}
              >
                Get started
              </a>

              <ul className="mt-6 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
