import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Images,
  Heart,
  Sparkles,
  TrendingUp,
  Loader2,
  FolderOpen,
  ArrowUpRight,
  Crown,
  Zap,
} from "lucide-react";
import { StatCard, StatsGrid } from "@/components/dashboard/DashboardStats";
import { GenerationCard } from "@/components/dashboard/GenerationCard";
import {
  fetchGenerations,
  toggleSaveGeneration,
  deleteGeneration,
} from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { getNextUpgrade, PLAN_CONFIG } from "@/lib/subscription";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
  head: () => ({
    meta: [
      { title: "Dashboard — نماذج Ai" },
      {
        name: "description",
        content: "View your AI ad generation history and stats.",
      },
    ],
  }),
});

interface Generation {
  id: string;
  user_id: string;
  template_id: string | null;
  template_image_url: string | null;
  product_image_url: string | null;
  result_image_url: string | null;
  prompt: string | null;
  status: string;
  is_saved: boolean;
  created_at: string;
}

function DashboardHome() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);

  const {
    planName,
    planKey,
    generationLimit,
    isSubscribed,
    usage,
    loading: subLoading,
  } = useSubscription();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [genResult, profileResult] = await Promise.all([
        fetchGenerations({ limit: 50 }),
        supabase.from("profiles").select("generation_count").single(),
      ]);
      setGenerations(genResult.data as Generation[]);
      setTotalCount(genResult.count);
      setGenerationCount(profileResult.data?.generation_count ?? 0);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const savedCount = generations.filter((g) => g.is_saved).length;
  const creditsUsed = usage?.used ?? generationCount;
  const creditsLimit = usage?.limit ?? generationLimit;
  const creditsRemaining = Math.max(0, creditsLimit - creditsUsed);
  const usagePercent = creditsLimit > 0 ? (creditsUsed / creditsLimit) * 100 : 0;
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = creditsUsed >= creditsLimit;

  const nextUpgrade = getNextUpgrade(planKey);
  const nextPlan = nextUpgrade ? PLAN_CONFIG[nextUpgrade] : null;

  const handleUpgrade = async () => {
    if (!nextPlan || !user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("Missing authentication token");
      }

      const response = await fetch("/api/update-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: nextPlan.id,
          planName: nextPlan.name,
          amount: nextPlan.price * 100, // cents
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to upgrade subscription");
      }

      toast.success(t("settings_payment_success"));
      await loadData();
    } catch (err: any) {
      console.error("Upgrade error:", err);
      toast.error(err.message || "Failed to upgrade. Please try again.");
    }
  };

  const handleToggleSave = async (id: string, saved: boolean) => {
    try {
      await toggleSaveGeneration(id, saved);
      setGenerations((prev) =>
        prev.map((g) => (g.id === id ? { ...g, is_saved: saved } : g))
      );
      toast.success(saved ? t("dash_toast_saved") : t("dash_toast_unsaved"));
    } catch (err) {
      toast.error(t("dash_toast_error"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteGeneration(user.id, id);
      setGenerations((prev) => prev.filter((g) => g.id !== id));
      setTotalCount((prev) => prev - 1);
      toast.success(t("dash_toast_deleted"));
    } catch (err) {
      toast.error(t("dash_toast_error"));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight text-gradient"
        >
          {t("dash_welcome")},{" "}
          {user?.user_metadata?.full_name?.split(" ")[0] ||
            user?.email?.split("@")[0]}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-sm text-muted-foreground"
        >
          {t("dash_welcome_desc")}
        </motion.p>
      </div>

      {/* Upgrade Banner — shown when near or at limit */}
      {isNearLimit && nextPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`relative overflow-hidden rounded-2xl p-5 ring-border-gradient ${
            isAtLimit
              ? "bg-red-500/5 border border-red-500/20"
              : "bg-amber-500/5 border border-amber-500/20"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isAtLimit
                    ? "bg-red-500/15 text-red-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {isAtLimit ? (
                  <Zap className="h-5 w-5" />
                ) : (
                  <Crown className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isAtLimit
                    ? t("dash_limit_reached_title")
                    : t("dash_near_limit_title")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAtLimit
                    ? t("dash_limit_reached_desc")
                        .replace("{plan}", nextPlan.name)
                        .replace("{limit}", String(nextPlan.limit))
                    : t("dash_near_limit_desc")
                        .replace("{remaining}", String(creditsRemaining))
                        .replace("{limit}", String(creditsLimit))}
                </p>
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              className="flex items-center gap-2 rounded-xl bg-accent-gradient px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-glow/40 hover:shadow-glow transition-all duration-300 whitespace-nowrap"
            >
              {t("dash_upgrade_btn")} {nextPlan.name}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <StatsGrid>
        <StatCard
          icon={Images}
          label={t("dash_stat_total")}
          value={totalCount}
          accent
        />
        <StatCard
          icon={Heart}
          label={t("dash_stat_saved")}
          value={savedCount}
        />
        <StatCard
          icon={Sparkles}
          label={
            isSubscribed
              ? `${planName} ${t("dash_stat_credits_plan")}`
              : t("dash_stat_credits")
          }
          value={`${creditsRemaining}/${creditsLimit}`}
        />
        <StatCard
          icon={TrendingUp}
          label={t("dash_stat_this_month")}
          value={
            generations.filter(
              (g) =>
                new Date(g.created_at).getMonth() === new Date().getMonth()
            ).length
          }
        />
      </StatsGrid>

      {/* Generation History */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground mb-6">
          {t("dash_history_title")}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : generations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-elevated border border-white/5 mb-6">
              <FolderOpen className="h-9 w-9 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {t("dash_empty_title")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              {t("dash_empty_desc")}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <AnimatePresence mode="popLayout">
              {generations.map((gen) => (
                <GenerationCard
                  key={gen.id}
                  id={gen.id}
                  templateImageUrl={gen.template_image_url}
                  productImageUrl={gen.product_image_url}
                  resultImageUrl={gen.result_image_url}
                  templateId={gen.template_id}
                  status={gen.status}
                  isSaved={gen.is_saved}
                  createdAt={gen.created_at}
                  onToggleSave={handleToggleSave}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
