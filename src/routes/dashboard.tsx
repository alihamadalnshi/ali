import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/components/AuthProvider";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  LayoutDashboard,
  Heart,
  PlusCircle,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

const navItems = [
  { to: "/dashboard" as const, icon: LayoutDashboard, labelKey: "dash_nav_overview", exact: true },
  { to: "/dashboard/saved" as const, icon: Heart, labelKey: "dash_nav_saved", exact: false },
  { to: "/dashboard/create" as const, icon: PlusCircle, labelKey: "dash_nav_create", exact: false },
  { to: "/dashboard/settings" as const, icon: Settings, labelKey: "dash_nav_settings", exact: false },
];

function DashboardLayout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";
  const userAvatar = user?.user_metadata?.avatar_url;
  const userEmail = user?.email || "";

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col glass-strong border-r border-white/5 transition-transform duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-accent-gradient shadow-glow">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </span>
              <span className="text-lg font-semibold tracking-tight">نماذج Ai</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-muted-foreground hover:text-foreground lg:hidden transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === "/dashboard" || location.pathname === "/dashboard/"
                : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/15 text-primary shadow-[0_0_15px_var(--glow)/0.1] border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-white/5 px-3 py-4 space-y-3">
            <LanguageSwitcher />
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 glass">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userDisplayName}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-gradient text-sm font-bold text-primary-foreground">
                  {userDisplayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{userDisplayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              {t("dash_sign_out")}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Top Bar (mobile) */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-xl px-4 py-3 lg:px-8 lg:py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-muted-foreground hover:text-foreground lg:hidden transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20 lg:hidden"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-gradient text-xs font-bold text-primary-foreground lg:hidden">
                  {userDisplayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <div className="px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
