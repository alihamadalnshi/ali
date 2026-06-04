import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Images, Heart, Sparkles, TrendingUp, Loader2, FolderOpen } from "lucide-react";
import { StatCard, StatsGrid } from "@/components/dashboard/DashboardStats";
import { GenerationCard } from "@/components/dashboard/GenerationCard";
import {
  fetchGenerations,
  toggleSaveGeneration,
  deleteGeneration,
} from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
  head: () => ({
    meta: [
      { title: "Dashboard — نماذج Ai" },
      { name: "description", content: "View your AI ad generation history and stats." },
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
          {t("dash_welcome")}, {user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0]}
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
          label={t("dash_stat_credits")}
          value={`${Math.max(0, 5 - generationCount)}/5`}
        />
        <StatCard
          icon={TrendingUp}
          label={t("dash_stat_this_month")}
          value={generations.filter(
            (g) => new Date(g.created_at).getMonth() === new Date().getMonth()
          ).length}
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
            <h3 className="text-lg font-semibold text-foreground">{t("dash_empty_title")}</h3>
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
