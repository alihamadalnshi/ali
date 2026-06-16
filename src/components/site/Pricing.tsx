import { motion } from "framer-motion";
import { Check, Sparkles, Loader2, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "./SectionHeader";
import { useAuth } from "@/components/AuthProvider";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_CONFIG } from "@/lib/subscription";
import { openTapCheckout } from "@/lib/tap-client";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function Pricing() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { planKey, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const isRtl = i18n.language === "ar";
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const tiers = [
    {
      id: "basic" as const,
      name: t("pricing_tier_basic"),
      price: 9,
      featured: false,
      imagesKey: "pricing_feature_images_30",
      productId: PLAN_CONFIG.basic.id,
      desc: isRtl
        ? "مثالي للمبتدئين لتجربة قوة الذكاء الاصطناعي"
        : "Perfect for starters to test the power of AI ads.",
    },
    {
      id: "pro" as const,
      name: t("pricing_tier_pro"),
      price: 19,
      featured: true,
      imagesKey: "pricing_feature_images_100",
      productId: PLAN_CONFIG.pro.id,
      desc: isRtl
        ? "الخيار الأفضل للشركات الناشئة والمسوقين"
        : "The absolute best value for startups and marketers.",
    },
    {
      id: "business" as const,
      name: t("pricing_tier_business"),
      price: 49,
      featured: false,
      imagesKey: "pricing_feature_images_300",
      productId: PLAN_CONFIG.business.id,
      desc: isRtl
        ? "شامل جميع الميزات للنمو السريع والتوسع"
        : "Fully loaded for fast growth and serious scaling.",
    },
  ];

  const handleChoosePlan = async (tier: (typeof tiers)[number]) => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    setLoadingTier(tier.id);

    try {
      const tierConfig = PLAN_CONFIG[tier.id];
      if (!tierConfig || !tierConfig.priceId) {
        toast.error("Plan not available yet. Please try again later.");
        return;
      }

      await openTapCheckout(tierConfig.priceId, user.id, user.email || "");
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Failed to open checkout. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  const getPlanOrder = (id: string) => {
    const order = { free: 0, basic: 1, pro: 2, business: 3 };
    return order[id as keyof typeof order] ?? 0;
  };

  const isCurrentPlan = (tierId: string) => planKey === tierId;
  const isDowngrade = (tierId: string) =>
    getPlanOrder(tierId) < getPlanOrder(planKey);
  const isUpgrade = (tierId: string) =>
    getPlanOrder(tierId) > getPlanOrder(planKey);

  return (
    <section id="pricing" className="relative py-32 overflow-hidden">
      {/* Background radial highlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        <SectionHeader
          eyebrow={t("pricing_eyebrow")}
          title={t("pricing_title")}
          description={t("pricing_desc")}
        />

        <div className="mt-20 grid gap-8 md:grid-cols-3 items-stretch max-w-5xl mx-auto">
          {tiers.map((tItem, i) => (
            <motion.div
              key={tItem.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`ring-border-gradient relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${
                tItem.featured
                  ? "glass-strong shadow-[0_0_50px_rgba(180,85,252,0.15)] border-primary/20"
                  : "glass"
              }`}
            >
              {tItem.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent-gradient px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground flex items-center gap-1 shadow-glow animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  {isRtl ? "الأكثر شعبية" : "MOST POPULAR"}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    {tItem.name}
                  </h3>
                  {isCurrentPlan(tItem.id) && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20 flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      {t("pricing_current")}
                    </span>
                  )}
                  {!isCurrentPlan(tItem.id) && tItem.featured && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {isRtl ? "قيمة رائعة" : "Best Value"}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                  {tItem.desc}
                </p>

                {/* Price layout */}
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-6xl font-extrabold tracking-tight text-gradient">
                    ${tItem.price}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">
                    /{t("pricing_mo")}
                  </span>
                </div>

                {/* Features box */}
                <div className="mt-8 border border-white/10 rounded-2xl p-5 bg-white/[0.02] shadow-inner relative overflow-hidden group/box">
                  {/* Subtle hover background sheen */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/box:opacity-100" />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary shadow-[0_0_10px_rgba(180,85,252,0.2)]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {t(tItem.imagesKey)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary shadow-[0_0_10px_rgba(180,85,252,0.2)]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {t("pricing_feature_templates")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary shadow-[0_0_10px_rgba(180,85,252,0.2)]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {t("pricing_feature_support")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => handleChoosePlan(tItem)}
                  disabled={
                    isCurrentPlan(tItem.id) ||
                    isDowngrade(tItem.id) ||
                    loadingTier === tItem.id ||
                    subLoading
                  }
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCurrentPlan(tItem.id)
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
                      : tItem.featured
                        ? "bg-accent-gradient text-primary-foreground shadow-glow hover:opacity-95 hover:shadow-[0_0_35px_var(--glow)]"
                        : "bg-white/10 text-foreground hover:bg-white/15 border border-white/5"
                  }`}
                >
                  {loadingTier === tItem.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrentPlan(tItem.id) ? (
                    t("pricing_current")
                  ) : isDowngrade(tItem.id) ? (
                    t("pricing_current_higher")
                  ) : (
                    t("pricing_btn_select")
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
