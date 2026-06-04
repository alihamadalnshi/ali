import { motion } from "framer-motion";
import { Download, Heart, Trash2, ExternalLink, Calendar, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface GenerationCardProps {
  id: string;
  templateImageUrl: string | null;
  productImageUrl: string | null;
  resultImageUrl: string | null;
  templateId: string | null;
  status: string;
  isSaved: boolean;
  createdAt: string;
  onToggleSave: (id: string, saved: boolean) => void;
  onDelete: (id: string) => void;
}

export function GenerationCard({
  id,
  templateImageUrl,
  productImageUrl,
  resultImageUrl,
  templateId,
  status,
  isSaved,
  createdAt,
  onToggleSave,
  onDelete,
}: GenerationCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [savingState, setSavingState] = useState(false);
  const [deletingState, setDeletingState] = useState(false);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSavingState(true);
    try {
      await onToggleSave(id, !isSaved);
    } finally {
      setSavingState(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingState(true);
    try {
      await onDelete(id);
    } finally {
      setDeletingState(false);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="group relative overflow-hidden rounded-2xl ring-border-gradient glass cursor-pointer transition-all duration-300 hover:shadow-glow/20 hover:scale-[1.02]"
        onClick={() => setIsExpanded(true)}
      >
        {/* Result Image */}
        <div className="relative aspect-[4/5] overflow-hidden">
          {resultImageUrl ? (
            <img
              src={resultImageUrl}
              alt={`Generation ${templateId}`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface">
              <p className="text-xs text-muted-foreground">{t("dash_no_image")}</p>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                status === "completed"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-destructive/20 text-destructive border border-destructive/30"
              }`}
            >
              {status === "completed" ? t("dash_status_done") : t("dash_status_failed")}
            </span>
          </div>

          {/* Save indicator */}
          {isSaved && (
            <div className="absolute top-3 right-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 backdrop-blur-md border border-primary/30">
                <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
              </div>
            </div>
          )}

          {/* Hover actions */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(createdAt), "MMM d, yyyy")}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleToggleSave}
                  disabled={savingState}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                    isSaved
                      ? "bg-primary/20 text-primary hover:bg-primary/30"
                      : "bg-white/10 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  }`}
                  title={isSaved ? t("dash_unsave") : t("dash_save")}
                >
                  {savingState ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
                  )}
                </button>
                {resultImageUrl && (
                  <a
                    href={resultImageUrl}
                    download={`ad-${id}.png`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-muted-foreground hover:text-foreground hover:bg-white/20 transition-all duration-200"
                    title={t("dash_download")}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={handleDelete}
                  disabled={deletingState}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                  title={t("dash_delete")}
                >
                  {deletingState ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setIsExpanded(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-5xl w-full glass-strong rounded-3xl p-6 shadow-elegant overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
              {/* Template */}
              {templateImageUrl && (
                <div className="flex flex-col items-center gap-3">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium bg-background/80 px-3 py-1 rounded-full backdrop-blur-md">
                    {t("result_template")}
                  </span>
                  <img
                    src={templateImageUrl}
                    className="rounded-2xl w-full aspect-[4/5] object-cover"
                    alt="Template"
                  />
                </div>
              )}

              {/* Product */}
              {productImageUrl && (
                <div className="flex flex-col items-center gap-3">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium bg-background/80 px-3 py-1 rounded-full backdrop-blur-md">
                    {t("result_product")}
                  </span>
                  <div className="w-full aspect-[4/5] bg-white/5 rounded-2xl p-4 flex items-center justify-center">
                    <img
                      src={productImageUrl}
                      className="max-w-full max-h-full object-contain drop-shadow-2xl"
                      alt="Product"
                    />
                  </div>
                </div>
              )}

              {/* Result */}
              {resultImageUrl && (
                <div className="flex flex-col items-center gap-3">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] bg-primary/10 px-3 py-1 rounded-full">
                    {t("result_final")}
                  </span>
                  <div className="relative w-full">
                    <img
                      src={resultImageUrl}
                      className="rounded-2xl w-full aspect-[4/5] object-cover"
                      alt="Result"
                    />
                    <a
                      href={resultImageUrl}
                      download={`ad-${id}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow hover:scale-105 transition-transform"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(createdAt), "MMMM d, yyyy 'at' h:mm a")}
                </span>
                {templateId && <span>Template: {templateId}</span>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleToggleSave}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                    isSaved
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-white/10 text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
                  {isSaved ? t("dash_saved") : t("dash_save")}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
