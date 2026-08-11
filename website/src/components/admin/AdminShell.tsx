"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  ClipboardList,
  CreditCard,
  Gift,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/adminUi";
import { ROUTES } from "@/lib/routes";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: "pending";
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Opérations",
    items: [
      { href: ROUTES.adminDashboard, label: "Tableau de bord", icon: LayoutDashboard },
      { href: ROUTES.adminBeta, label: "Liste d’attente", icon: ClipboardList, badge: "pending" },
      { href: ROUTES.adminFeedback, label: "Retours bêta", icon: Mail },
    ],
  },
  {
    label: "Croissance",
    items: [
      { href: ROUTES.adminVisites, label: "Visites", icon: Activity },
      { href: ROUTES.adminAnalytics, label: "Analytics", icon: BarChart3 },
      { href: ROUTES.adminReferrals, label: "Parrainage", icon: Gift },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: ROUTES.adminUsers, label: "Utilisateurs", icon: Users },
      { href: ROUTES.adminSubscriptions, label: "Abonnements", icon: CreditCard },
      { href: ROUTES.adminReports, label: "Modération", icon: UsersRound },
    ],
  },
  {
    label: "Contrôle",
    items: [
      { href: ROUTES.adminLogs, label: "Journal", icon: ClipboardList },
      { href: ROUTES.adminSettings, label: "Paramètres", icon: Settings },
    ],
  },
];

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href !== ROUTES.adminDashboard && pathname.startsWith(`${href}/`)) return true;
  return false;
}

type Props = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  pendingBetaCount?: number;
};

export function AdminShell({
  children,
  title,
  subtitle,
  actions,
  pendingBetaCount,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.body.classList.add("admin-nav-lock");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("admin-nav-lock");
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          href={ROUTES.adminDashboard}
          onClick={() => setMobileOpen(false)}
          className="flex min-h-11 items-center gap-2.5 px-1"
        >
          <span className="flex h-8 w-8 items-center justify-center bg-[var(--proday-accent)] text-[10px] font-bold tracking-wide text-white">
            PD
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold tracking-tight text-white">ProDay</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">Admin</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-2 py-3" aria-label="Admin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;
                const showBadge =
                  item.badge === "pending" &&
                  typeof pendingBetaCount === "number" &&
                  pendingBetaCount > 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex min-h-11 items-center gap-2.5 rounded px-2.5 py-2 text-[13px] transition active:bg-white/[0.06] ${
                        active
                          ? "bg-[var(--proday-accent)]/20 text-white"
                          : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <Icon size={16} strokeWidth={active ? 2.25 : 2} className="shrink-0 opacity-80" />
                      <span className="flex-1 truncate font-medium">{item.label}</span>
                      {showBadge ? (
                        <span className="min-w-[1.35rem] rounded bg-amber-500/20 px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums text-amber-100">
                          {pendingBetaCount}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex min-h-11 w-full items-center gap-2.5 rounded px-2.5 py-2 text-[13px] text-white/45 transition hover:bg-white/[0.04] hover:text-white active:bg-white/[0.06]"
        >
          <LogOut size={16} />
          Quitter
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-shell relative min-h-screen bg-[#0a0a0c] text-white">
      <div className="admin-mobile-bar sticky top-0 z-30 flex items-center gap-2 border-b border-white/10 bg-[#0a0a0c]/95 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 text-white/75 active:bg-white/[0.06]"
          aria-label="Ouvrir le menu"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold tracking-tight text-white">{title}</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
            ProDay Admin
          </p>
        </div>
        {typeof pendingBetaCount === "number" && pendingBetaCount > 0 ? (
          <Link
            href={ROUTES.adminBeta}
            className="shrink-0 rounded bg-amber-500/20 px-2 py-1 font-mono text-[10px] font-bold tabular-nums text-amber-100"
            aria-label={`${pendingBetaCount} en attente`}
          >
            {pendingBetaCount}
          </Link>
        ) : (
          <div className="w-6 shrink-0" />
        )}
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="admin-drawer absolute inset-y-0 left-0 flex w-[min(280px,88vw)] flex-col border-r border-white/10 bg-[#0a0a0c] shadow-2xl">
            <div className="absolute right-1 top-[max(0.25rem,env(safe-area-inset-top))] z-10">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center text-white/50 active:text-white"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 border-r border-white/10 bg-[#0a0a0c] lg:block">
          {sidebar}
        </aside>

        <div className="admin-main min-w-0 flex-1 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pt-4 lg:px-6 lg:py-5">
          <div className="lg:hidden">
            {/* Title already in sticky bar : keep actions + subtitle only */}
            {(subtitle || actions) && (
              <div className="mb-3 flex flex-col gap-2 border-b border-white/10 pb-3">
                {subtitle ? (
                  <p className="text-xs leading-relaxed text-white/45">{subtitle}</p>
                ) : null}
                {actions ? (
                  <div className="flex flex-wrap items-stretch gap-1.5 [&_button]:min-h-10 [&_button]:flex-1 sm:[&_button]:flex-none">
                    {actions}
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <div className="hidden lg:block">
            <AdminPageHeader title={title} subtitle={subtitle} actions={actions} />
          </div>
          <div className="admin-page space-y-3 sm:space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
