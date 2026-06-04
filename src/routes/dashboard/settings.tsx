import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Shield, Loader2, Save, AlertTriangle, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — نماذج Ai" },
      { name: "description", content: "Manage your account settings." },
    ],
  }),
});

function SettingsPage() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.from("profiles").select("full_name").single();
      if (data) {
        setFullName(data.full_name || "");
      }
      setProfileLoaded(true);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq("id", user?.id);

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      toast.success(t("dash_settings_saved"));
    } catch (err) {
      toast.error(t("dash_toast_error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight text-gradient"
        >
          {t("dash_settings_title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-sm text-muted-foreground"
        >
          {t("dash_settings_desc")}
        </motion.p>
      </div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl glass-strong p-6 ring-border-gradient space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gradient shadow-glow/30">
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{t("dash_settings_profile")}</h2>
            <p className="text-xs text-muted-foreground">{t("dash_settings_profile_desc")}</p>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-gradient text-xl font-bold text-primary-foreground">
              {(fullName || user?.email || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-foreground">{fullName || t("dash_settings_no_name")}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="settings-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t("dash_settings_name")}
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="settings-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("dash_settings_name_placeholder")}
              disabled={!profileLoaded}
              className="w-full rounded-xl border border-border/60 bg-surface py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-300 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t("dash_settings_email")}
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full rounded-xl border border-border/60 bg-surface py-3 pl-10 pr-4 text-sm text-muted-foreground opacity-60 cursor-not-allowed"
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground/60">{t("dash_settings_email_hint")}</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-accent-gradient px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow/40 transition-all duration-300 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("dash_settings_save")}
        </button>
      </motion.div>

      {/* Plan Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl glass p-6 ring-border-gradient space-y-4"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated border border-white/5">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{t("dash_settings_plan")}</h2>
            <p className="text-xs text-muted-foreground">{t("dash_settings_plan_desc")}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface p-4 border border-white/5">
          <div>
            <p className="text-sm font-semibold text-foreground">{t("dash_settings_free_plan")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("dash_settings_free_plan_desc")}</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            {t("dash_settings_active")}
          </span>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 space-y-4"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-destructive/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{t("dash_settings_danger")}</h2>
            <p className="text-xs text-muted-foreground">{t("dash_settings_danger_desc")}</p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          {t("dash_sign_out")}
        </button>
      </motion.div>
    </div>
  );
}
