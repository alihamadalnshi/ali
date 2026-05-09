import { motion } from "framer-motion";
import { ArrowRight, Play, Upload, Wand2, ImageIcon } from "lucide-react";
import templateImg from "@/assets/template-1.jpg";
import productImg from "@/assets/product-upload.jpg";
import resultImg from "@/assets/ai-result.jpg";

function Card({
  label,
  step,
  icon: Icon,
  image,
  delay,
  badge,
  rotate = 0,
}: {
  label: string;
  step: string;
  icon: React.ElementType;
  image: string;
  delay: number;
  badge?: string;
  rotate?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, rotate: 0, transition: { duration: 0.4 } }}
      className="group relative w-full"
    >
      <div className="ring-border-gradient glass-strong relative overflow-hidden rounded-3xl shadow-elegant">
        <div className="flex items-center justify-between gap-2 px-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {step}
              </p>
              <p className="text-sm font-medium leading-tight">{label}</p>
            </div>
          </div>
          {badge && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <div className="relative m-3 mt-3 aspect-[4/5] overflow-hidden rounded-2xl">
          <img
            src={image}
            alt={label}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>
      </div>
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />
    </motion.div>
  );
}

function Connector({ delay }: { delay: number }) {
  return (
    <div className="relative hidden items-center justify-center self-center md:flex">
      <motion.svg
        width="80"
        height="40"
        viewBox="0 0 80 40"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay }}
      >
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.22 295 / 0)" />
            <stop offset="50%" stopColor="oklch(0.72 0.22 295 / 1)" />
            <stop offset="100%" stopColor="oklch(0.65 0.2 260 / 0)" />
          </linearGradient>
        </defs>
        <motion.path
          d="M2 20 Q 40 -8 78 20"
          fill="none"
          stroke="url(#g)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, delay }}
        />
        <motion.circle
          cx="78"
          cy="20"
          r="2.5"
          fill="oklch(0.72 0.22 295)"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.4, 1] }}
          transition={{ duration: 0.6, delay: delay + 0.8 }}
        />
      </motion.svg>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 sm:pt-40">
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[800px] grid-bg opacity-40" />
      <div className="pointer-events-none absolute inset-0 noise opacity-[0.4] mix-blend-overlay" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <a
            href="#"
            className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--glow)]" />
            New · v2.0 — Real-time generation, 4× faster
            <ArrowRight className="h-3 w-3" />
          </a>

          <h1 className="text-balance text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
            <span className="text-gradient">Turn any product into</span>
            <br />
            <span className="text-gradient-accent">stunning AI ads</span>
            <span className="text-gradient"> in seconds.</span>
          </h1>

          <p className="mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            Upload your product, choose a template, and instantly generate
            professional marketing creatives powered by AI — no prompts, no
            designers, no waiting.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href="#cta"
              className="group inline-flex items-center gap-2 rounded-xl bg-accent-gradient px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
            >
              Generate your first ad
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how"
              className="glass inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-white/10"
            >
              <Play className="h-4 w-4" /> Watch demo
            </a>
          </div>
        </motion.div>

        {/* Workflow cards */}
        <div className="relative mx-auto mt-16 max-w-6xl sm:mt-20">
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-2">
            <Card
              label="Choose Template"
              step="Step 01"
              icon={ImageIcon}
              image={templateImg}
              delay={0.2}
              rotate={-2}
              badge="120+ presets"
            />
            <Connector delay={0.7} />
            <Card
              label="Upload Product"
              step="Step 02"
              icon={Upload}
              image={productImg}
              delay={0.4}
              badge="PNG · JPG"
            />
            <Connector delay={0.9} />
            <Card
              label="AI Result"
              step="Step 03"
              icon={Wand2}
              image={resultImg}
              delay={0.6}
              rotate={2}
              badge="HD · 4K"
            />
          </div>

          {/* floating processing pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="glass-strong absolute left-1/2 top-full mt-6 hidden -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2 text-xs text-muted-foreground shadow-elegant md:inline-flex"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Processing with Lumen Diffusion v2 · ~3.4s avg
          </motion.div>
        </div>

        {/* Trust strip */}
        <div className="mt-32 flex flex-col items-center gap-4 pb-10 sm:mt-36">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Trusted by 12,000+ modern brands
          </p>
          <div className="grid w-full max-w-4xl grid-cols-3 items-center gap-x-8 gap-y-4 opacity-70 sm:grid-cols-6">
            {["Linear", "Vercel", "Framer", "Notion", "Arc", "Raycast"].map((b) => (
              <div
                key={b}
                className="text-center text-sm font-semibold tracking-tight text-muted-foreground"
              >
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
