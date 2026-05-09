import { motion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { Star } from "lucide-react";

const stats = [
  { v: "12K+", l: "Brands shipping" },
  { v: "3.4M", l: "Ads generated" },
  { v: "<4s", l: "Avg. render time" },
  { v: "98%", l: "CSAT score" },
];

const testimonials = [
  {
    q: "We replaced an entire creative agency with Lumen. Output quality is genuinely shocking.",
    n: "Maya Chen",
    r: "Head of Growth, Northwave",
  },
  {
    q: "From upload to ad set in under 2 minutes. CTR went up 34% week one.",
    n: "Daniel Reyes",
    r: "Co-founder, Halostudio",
  },
  {
    q: "It feels like having a senior art director on call, 24/7.",
    n: "Aisha Patel",
    r: "CMO, Olm & Co.",
  },
];

export function Trust() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Loved by operators"
          title="The new standard for ad creative."
        />

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l} className="ring-border-gradient glass rounded-2xl p-5 text-center">
              <p className="text-3xl font-semibold tracking-tight text-gradient-accent sm:text-4xl">
                {s.v}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {s.l}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="ring-border-gradient glass rounded-2xl p-6"
            >
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/90">"{t.q}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent-gradient" />
                <div>
                  <p className="text-sm font-medium">{t.n}</p>
                  <p className="text-xs text-muted-foreground">{t.r}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
