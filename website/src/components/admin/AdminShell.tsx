"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  ClipboardList,
  CreditCard,
  FileText,
  Gift,
  LayoutDashboard,
  Layers,
  LogOut,
  Mail,
  Menu,
  Settings,
  Shield,
  Users,
  UsersRound,
  X,
} from "lucide-react";
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
    label: "Vue d’ensemble",
    items: [
      { href: ROUTES.adminDashboard, label: "Dashboard", icon: LayoutDashboard },
      { href: ROUTES.adminBeta, label: "Liste d’attente", icon: ClipboardList, badge: "pending" },
      { href: ROUTES.adminVisites, label: "Visites", icon: Activity },
      { href: ROUTES.adminAnalytics, label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: ROUTES.adminUsers, label: "Utilisateurs", icon: Users },
      { href: ROUTES.adminSubscriptions, label: "Abonnements", icon: CreditCard },
      { href: ROUTES.adminRoles, label: "Rôles & droits", icon: Shield },
      { href: ROUTES.adminReferrals, label: "Parrainage", icon: Gift },
      { href: ROUTES.adminReports, label: "Modération", icon: UsersRound },
    ],
  },
  {
    label: "Contenu & ops",
    items: [
      { href: ROUTES.adminContent, label: "Contenu", icon: FileText },
      { href: ROUTES.adminPoles, label: "Pôles", icon: Layers },
      { href: ROUTES.adminEmails, label: "Emails", icon: Mail },
      { href: ROUTES.adminLogs, label: "Journal d’activité", icon: ClipboardList },
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
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.07] px-4 py-5">
        <Link href={ROUTES.adminDashboard} className="group block px-1">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0054F0] text-[11px] font-bold tracking-wide text-white shadow-[0_0_0_1px_rgba(76,139,255,0.35),0_8px_24px_-8px_rgba(0,84,240,0.7)]">
              PD
            </span>
            <div className="min-w-0">
              <p className="font-display text-[15px] font-bold tracking-[0.1em] text-white">
                PRODAY
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7AA7FF]/90">
                Admin fondateurs
              </p>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5" aria-label="Admin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
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
                      className={`group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition ${
                        active
                          ? "bg-[#0054F0]/18 text-white"
                          : "text-white/55 hover:bg-white/[0.045] hover:text-white"
                      }`}
                    >
                      {active ? (
                        <span
                          aria-hidden
                          className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[#4C8BFF]"
                        />
                      ) : null}
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                          active
                            ? "bg-[#0054F0] text-white shadow-[0_0_0_1px_rgba(76,139,255,0.35)]"
                            : "bg-white/[0.04] text-white/55 group-hover:bg-white/[0.07] group-hover:text-white"
                        }`}
                      >
                        <Icon size={15} strokeWidth={active ? 2.25 : 2} />
                      </span>
                      <span className="flex-1 truncate font-medium tracking-tight">
                        {item.label}
                      </span>
                      {showBadge ? (
                        <span
                          className={`min-w-[1.35rem] rounded-md px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-amber-500/20 text-amber-100"
                          }`}
                        >
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

      <div className="border-t border-white/[0.07] p-3">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-white/45 transition hover:bg-white/[0.045] hover:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
            <LogOut size={15} />
          </span>
          Quitter
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-shell relative min-h-screen bg-[#05070d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,84,240,0.16),transparent_48%),radial-gradient(ellipse_at_bottom_right,rgba(10,20,48,0.55),transparent_42%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:64px_64px]" />

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.07] bg-[#05070d]/92 px-4 py-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-white/80 transition hover:bg-white/[0.06]"
          aria-label="Ouvrir le menu"
        >
          <Menu size={18} />
        </button>
        <div className="text-center">
          <p className="font-display text-sm font-bold tracking-[0.12em]">PRODAY</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7AA7FF]/80">
            Admin
          </p>
        </div>
        <div className="w-9" />
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/65 backdrop-blur-[1px]"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="admin-drawer absolute inset-y-0 left-0 flex w-[min(300px,88vw)] flex-col border-r border-white/[0.08] bg-[#080b14] shadow-[20px_0_60px_-20px_rgba(0,0,0,0.8)]">
            <div className="absolute right-2 top-2 z-10">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-white/50 transition hover:bg-white/[0.06] hover:text-white"
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
        <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 border-r border-white/[0.07] bg-[#080b14]/90 backdrop-blur-sm lg:block">
          {sidebar}
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
          <header className="mb-7 flex flex-col gap-4 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7AA7FF]">
                Admin · ProDay
              </p>
              <h1 className="mt-2 font-display text-[1.85rem] font-bold tracking-tight text-white sm:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/48">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
            ) : null}
          </header>
          <div className="admin-page space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
