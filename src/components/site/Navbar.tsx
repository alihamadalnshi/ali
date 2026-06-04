import { motion } from "framer-motion";
import { Sparkles, LayoutDashboard, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { LanguageSwitcher } from "./../LanguageSwitcher";
import { useAuth } from "@/components/AuthProvider";

const getLinks = (t: any) => [
  { label: t('nav_templates'), href: "#templates" },
  { label: t('nav_features'), href: "#features" },
  { label: t('nav_faq'), href: "#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const links = getLinks(t);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={`flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 ${
            scrolled ? "glass-strong shadow-elegant" : "bg-transparent"
          }`}
        >
          <a href="#top" className="flex items-center gap-2">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-accent-gradient shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="text-base font-semibold tracking-tight">نماذج Ai</span>
          </a>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            {!loading && (
              <>
                {user ? (
                  <Link
                    to="/dashboard"
                    className="group flex items-center gap-2 rounded-xl bg-accent-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow/40 transition-all duration-300 hover:shadow-glow hover:scale-[1.02]"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t("nav_dashboard")}</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="group flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-xs font-medium text-foreground hover:bg-white/15 hover:border-primary/30 transition-all duration-300"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t("nav_signin")}</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
