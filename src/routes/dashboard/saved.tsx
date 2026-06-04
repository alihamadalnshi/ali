import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2 } from "lucide-react";
import { GenerationCard } from "@/components/dashboard/GenerationCard";
import {
  fetchGenerations,
  toggleSaveGeneration,
  deleteGeneration,
} from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/saved")({
  component: SavedAds,
  head: () => ({
    meta: [
      { title: "Saved Ads — نماذج Ai" },
      { name: "description", content: "View your saved AI ad creatives." },
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

function SavedAds() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchGenerations({ savedOnly: true, limit: 50 });
      setGenerations(result.data as Generation[]);
    } catch (err) {
      console.error("Failed to load saved ads:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleSave = async (id: string, saved: boolean) => {
    try {
      await toggleSaveGeneration(id, saved);
      if (!saved) {
        setGenerations((prev) => prev.filter((g) => g.id !== id));
      }
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
      toast.success(t("dash_toast_deleted"));
    } catch (err) {
      toast.error(t("dash_toast_error"));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight text-gradient"
        >
          {t("dash_saved_title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-sm text-muted-foreground"
        >
          {t("dash_saved_desc")}
        </motion.p>
      </div>

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
            <Heart className="h-9 w-9 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{t("dash_saved_empty_title")}</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {t("dash_saved_empty_desc")}
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
  );
}
