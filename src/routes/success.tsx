import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/success")({
  component: SuccessPage,
});

function SuccessPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === "ar";
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    // Start countdown and redirect
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate({
            to: "/dashboard/settings",
            search: { payment: "success" },
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground relative overflow-hidden px-4">
      {/* Background radial highlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full rounded-3xl glass-strong p-8 ring-border-gradient text-center space-y-6 relative z-10 shadow-glow/10"
      >
        {/* Animated Checkmark */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
          >
            <CheckCircle2 className="h-10 w-10 stroke-[2]" />
          </motion.div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gradient">
            {isRtl ? "تم الدفع بنجاح!" : "Payment Successful!"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isRtl
              ? "شكراً لك على اشتراكك. نقوم حالياً بتنشيط حسابك..."
              : "Thank you for your purchase. We are activating your subscription now..."}
          </p>
        </div>

        {/* Status Indicator */}
        <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-4 flex items-center justify-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs font-medium text-muted-foreground">
            {isRtl
              ? `إعادة توجيه إلى لوحة التحكم خلال ${countdown} ثوانٍ...`
              : `Redirecting to dashboard in ${countdown}s...`}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={() =>
            navigate({
              to: "/dashboard/settings",
              search: { payment: "success" },
            })
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold bg-accent-gradient text-primary-foreground shadow-glow hover:opacity-95 transition-all duration-300"
        >
          <span>{isRtl ? "الذهاب إلى لوحة التحكم" : "Go to Dashboard"}</span>
          <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
        </button>
      </motion.div>
    </div>
  );
}
