import { motion } from "framer-motion";
import { Wand2, Zap, ImagePlus, Sparkles, Bot, ShieldCheck } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const features = [
  { icon: Wand2, title: "One-click generation", desc: "No prompts. No setup. Click and ship." },
  { icon: Bot, title: "Realistic replacement", desc: "Your product, integrated with perfect lighting and scale." },
  { icon: Sparkles, title: "Marketing-grade output", desc: "Cinematic visuals built for ads, not just demos." },
  { icon: Zap, title: "Lightning-fast", desc: "Average 3.4s per generation. Burst up to 200/min." },
  { icon: ImagePlus, title: "120+ ad templates", desc: "From luxury to lifestyle, hand-curated weekly." },
  { icon: ShieldCheck, title: "Commercial-safe", desc: "Full IP rights, brand-safe outputs, audit logs." },
];

export function Features() {
  return (
    <section id="features" className="relative py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Built for modern brands"
          title="Studio-quality ads, on autopilot."
          description="Everything a growth team needs to ship creative at the speed of thought."
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
