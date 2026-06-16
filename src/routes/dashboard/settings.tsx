import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Shield,
  Loader2,
  Save,
  AlertTriangle,
  Trash2,
  Crown,
  Zap,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_CONFIG, getNextUpgrade } from "@/lib/subscription";
import { openTapCheckout } from "@/lib/tap-client";

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
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    const isArabic = i18n.language === "ar";
    const confirmMessage = isArabic 
      ? "هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع بياناتك ومسوداتك."
      : "Are you sure you want to delete your account permanently? This action cannot be undone and all your data and generated images will be deleted.";
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingAccount(true);
    try {
      const { error } = await supabase.rpc("delete_user_account");
      if (error) throw error;
      
      toast.success(isArabic ? "تم حذف الحساب بنجاح." : "Account deleted successfully.");
      await signOut();
    } catch (err: any) {
      console.error("Error deleting account:", err);
      toast.error(isArabic ? "فشل حذف الحساب. يرجى المحاولة مرة أخرى." : "Failed to delete account. Please try again.");
    } finally {
      setDeletingAccount(false);
    }
  };
  const {
    plan,
    planName,
    planKey,
    generationLimit,
    isSubscribed,
    loading: subLoading,
    usage,
    refresh,
  } = useSubscription();

  // Check for payment success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      toast.success(t("settings_payment_success"));
      // Clean the URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [t]);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .single();
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

  const nextUpgrade = getNextUpgrade(planKey);
  const nextPlan = nextUpgrade ? PLAN_CONFIG[nextUpgrade] : null;

  const handleUpgrade = async () => {
    if (!nextPlan || !user) return;
    
    try {
      // Find the next tier config to get the Paddle priceId
      const nextTierConfig = nextUpgrade ? PLAN_CONFIG[nextUpgrade] : null;
      if (!nextTierConfig || !nextTierConfig.priceId) {
        toast.error("Upgrade not available yet. Please try again later.");
        return;
      }

      await openTapCheckout(nextTierConfig.priceId, user.id, user.email || "");
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Failed to open checkout. Please try again.");
    }
  };

  const getPlanColor = () => {
    switch (planKey) {
      case "business":
        return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "pro":
        return "text-purple-400 bg-purple-400/10 border-purple-400/20";
      case "basic":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      default:
        return "text-muted-foreground bg-white/5 border-white/10";
    }
  };

  const getPlanIcon = () => {
    switch (planKey) {
      case "business":
      case "pro":
        return <Crown className="h-5 w-5" />;
      case "basic":
        return <Zap className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5 text-primary" />;
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
            <h2 className="text-base font-semibold text-foreground">
              {t("dash_settings_profile")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("dash_settings_profile_desc")}
            </p>
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
            <p className="text-sm font-medium text-foreground">
              {fullName || t("dash_settings_no_name")}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="settings-name"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
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
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            {t("dash_settings_email_hint")}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-accent-gradient px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow/40 transition-all duration-300 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t("dash_settings_save")}
        </button>
      </motion.div>

      {/* Subscription Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl glass p-6 ring-border-gradient space-y-4"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated border border-white/5">
            {getPlanIcon()}
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {t("dash_settings_plan")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("dash_settings_plan_desc")}
            </p>
          </div>
        </div>

        {subLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Current Plan Card */}
            <div className="rounded-xl bg-surface p-5 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {isSubscribed
                        ? `${planName} ${t("settings_plan_label")}`
                        : t("dash_settings_free_plan")}
                      {isSubscribed && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPlanColor()}`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {t("dash_settings_active")}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isSubscribed
                        ? `${t("settings_gen_limit")}: ${generationLimit} ${t("settings_per_period")}`
                        : t("dash_settings_free_plan_desc")}
                    </p>
                  </div>
                </div>
                {!isSubscribed && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    {t("dash_settings_active")}
                  </span>
                )}
              </div>

              {/* Usage Bar */}
              {usage && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("settings_usage_label")}
                    </span>
                    <span className="font-medium text-foreground">
                      {usage.used}/{usage.limit}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (usage.used / usage.limit) * 100)}%`,
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full transition-colors ${
                        usage.used / usage.limit > 0.9
                          ? "bg-red-500"
                          : usage.used / usage.limit > 0.7
                            ? "bg-amber-500"
                            : "bg-primary"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Subscription Details */}
              {plan?.subscription && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  {plan.subscription.current_period_end && (
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        {t("settings_renews")}
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        {new Date(
                          plan.subscription.current_period_end
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {plan.subscription.amount && (
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        {t("settings_amount")}
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        ${(plan.subscription.amount / 100).toFixed(2)}/mo
                      </p>
                    </div>
                  )}
                  {plan.subscription.cancel_at_period_end && (
                    <div className="col-span-2">
                      <p className="text-xs text-amber-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        {t("settings_canceling")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upgrade CTA */}
            {nextPlan && (
              <motion.button
                onClick={handleUpgrade}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-between rounded-xl bg-accent-gradient/10 border border-primary/20 p-4 text-left hover:bg-accent-gradient/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-gradient shadow-glow/30">
                    <ArrowUpRight className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t("settings_upgrade_to")} {nextPlan.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("settings_upgrade_desc")
                        .replace("{limit}", String(nextPlan.limit))
                        .replace("{price}", String(nextPlan.price))}
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.button>
            )}
            {/* Manage Subscription */}
            {isSubscribed && (
              <a
                href={
                  import.meta.env.VITE_BILLING_PORTAL_URL
                    ? `${import.meta.env.VITE_BILLING_PORTAL_URL}${
                        import.meta.env.VITE_BILLING_PORTAL_URL.includes("?") ? "&" : "?"
                      }email=${encodeURIComponent(user?.email || "")}`
                    : "#"
                }
                target={import.meta.env.VITE_BILLING_PORTAL_URL ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!import.meta.env.VITE_BILLING_PORTAL_URL) {
                    e.preventDefault();
                    const isArabic = i18n.language === "ar";
                    toast.info(
                      isArabic 
                        ? "إدارة الاشتراكات غير متوفرة حالياً. يرجى التواصل مع الدعم الفني." 
                        : "Billing management portal is currently unavailable. Please contact support."
                    );
                  }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all duration-200"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {i18n.language === "ar" ? "إدارة الاشتراك" : "Manage subscription"}
              </a>
            )}
          </>
        )}
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
            <h2 className="text-base font-semibold text-foreground">
              {t("dash_settings_danger")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("dash_settings_danger_desc")}
            </p>
          </div>
        </div>

        <button
          onClick={handleDeleteAccount}
          disabled={deletingAccount}
          className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-all duration-200 disabled:opacity-50"
        >
          {deletingAccount ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {deletingAccount 
            ? t("dash_settings_delete_account_loading") 
            : t("dash_settings_delete_account")}
        </button>
      </motion.div>
    </div>
  );
}
