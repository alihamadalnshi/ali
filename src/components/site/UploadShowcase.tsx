import { motion } from "framer-motion";
import { Upload, Sparkles, Check } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import productImg from "@/assets/product-upload.jpg";
import resultImg from "@/assets/ai-result.jpg";
import { useState } from "react";

export function UploadShowcase() {
  return (
    <section id="how" className="relative py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="How it works"
          title="Drop your product. Watch the magic."
          description="A drag, a click, a result. Lumen does the rest — handling lighting, scale and composition automatically."
        />

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2">
          {/* Upload zone */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="ring-border-gradient glass-strong relative overflow-hidden rounded-3xl p-6 shadow-elegant"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Upload product
              </p>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Ready
              </span>
            </div>

            <div className="relative mt-4 overflow-hidden rounded-2xl border border-dashed border-white/10 bg-black/30 p-6">
              <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr] sm:items-center">
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <img src={productImg} alt="Uploaded product" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div>
                  <p className="text-sm font-medium">perfume_v2.png</p>
                  <p className="text-xs text-muted-foreground">2.4 MB · 2048×2048</p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.6, ease: "easeOut" }}
                      className="h-full bg-accent-gradient shimmer"
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    Background removed · Subject locked
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Upload className="h-3.5 w-3.5" /> Drop, paste or browse
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-accent-gradient px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow">
                <Sparkles className="h-3.5 w-3.5" /> Generate
              </button>
            </div>
          </motion.div>

          {/* Before / after slider */}
          <BeforeAfter />
        </div>
      </div>
    </section>
  );
}

function BeforeAfter() {
  const [pos, setPos] = useState(50);
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="ring-border-gradient relative overflow-hidden rounded-3xl shadow-elegant"
    >
      <div className="relative aspect-[4/5] select-none">
        <img src={resultImg} alt="AI result" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${pos}%` }}
        >
          <img
            src={productImg}
            alt="Original product"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ width: `${100 / (pos / 100)}%`, maxWidth: "none" }}
            loading="lazy"
          />
        </div>
        <div
          className="absolute inset-y-0 z-10 w-px bg-white/80 shadow-[0_0_20px_var(--glow)]"
          style={{ left: `${pos}%` }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full glass-strong px-2.5 py-1 text-[10px] font-medium">
            Drag
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
          aria-label="Before after slider"
        />
        <div className="absolute left-3 top-3 rounded-full glass px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Before
        </div>
        <div className="absolute right-3 top-3 rounded-full glass px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-foreground">
          After · AI
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/5 bg-black/20 px-4 py-3 text-xs text-muted-foreground">
        <span>Generated in 3.2s · 4K · Studio Marble preset</span>
        <div className="flex gap-2">
          <button className="rounded-md px-2.5 py-1 hover:bg-white/5">Share</button>
          <button className="rounded-md bg-foreground px-2.5 py-1 text-background">Download</button>
        </div>
      </div>
    </motion.div>
  );
}
