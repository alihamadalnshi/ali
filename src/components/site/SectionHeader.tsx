import { motion } from "framer-motion";

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col gap-4 ${align === "center" ? "items-center text-center mx-auto max-w-2xl" : "items-start text-left"}`}
    >
      {eyebrow && (
        <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_var(--glow)]" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
        <span className="text-gradient">{title}</span>
      </h2>
      {description && (
        <p className="text-balance text-base text-muted-foreground sm:text-lg">{description}</p>
      )}
    </motion.div>
  );
}
