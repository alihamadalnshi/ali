import { motion } from "framer-motion";
import { useState } from "react";
import { SectionHeader } from "./SectionHeader";
import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import g5 from "@/assets/gallery-5.jpg";
import g6 from "@/assets/gallery-6.jpg";

const items = [
  { img: g1, title: "Neon Drop", category: "Fashion", span: "row-span-2" },
  { img: g2, title: "Botanic", category: "Beauty", span: "" },
  { img: g3, title: "Midnight Gold", category: "Luxury", span: "" },
  { img: g4, title: "Pulse", category: "Tech", span: "row-span-2" },
  { img: g5, title: "Soft Studio", category: "Food & Drink", span: "" },
  { img: g6, title: "Mirage", category: "Lifestyle", span: "" },
];

const categories = ["All", "Fashion", "Beauty", "Tech", "Luxury", "Food & Drink", "Lifestyle"];

export function TemplateGallery() {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? items : items.filter((i) => i.category === active);

  return (
    <section id="templates" className="relative py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Template gallery"
          title="A library of cinematic ad templates."
          description="Hand-crafted, conversion-tested. Start from a template, swap in your product, ship in minutes."
        />

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full px-3.5 py-1.5 text-xs transition-all ${
                active === c
                  ? "bg-foreground text-background"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-12 grid auto-rows-[180px] grid-cols-2 gap-4 sm:auto-rows-[220px] md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className={`group ring-border-gradient relative overflow-hidden rounded-2xl shadow-card ${it.span}`}
            >
              <img
                src={it.img}
                alt={it.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-90" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {it.category}
                  </p>
                  <p className="text-sm font-medium">{it.title}</p>
                </div>
                <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-medium text-background opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Use template
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
