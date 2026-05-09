import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { SectionHeader } from "./SectionHeader";

const faqs = [
  { q: "How does Lumen generate ads?", a: "Our diffusion model swaps your product into curated ad templates while preserving lighting, perspective and scale automatically." },
  { q: "Do I own the rights to the output?", a: "Yes. All generations are commercial-use, royalty-free, and yours forever." },
  { q: "What file types do you support?", a: "PNG, JPG and WebP up to 25MB. Transparent PNGs work best for clean replacements." },
  { q: "Can I use my own templates?", a: "On Studio and Scale plans you can upload brand templates and presets that are reusable across your team." },
  { q: "Is there a free trial?", a: "Yes — 5 free generations, no credit card required." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeader eyebrow="FAQ" title="Questions, answered." />

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
