"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
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

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href={ROUTES.adminDashboard} className="block">
          <p className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-[0.08em] text-white">
            PRODAY
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4C8BFF]">
            Admin fondateurs
          </p>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
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
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                        active
                          ? "bg-[#0054F0] text-white shadow-[0_0_0_1px_rgba(76,139,255,0.35)]"
                          : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <Icon size={16} className="shrink-0 opacity-90" />
                      <span className="flex-1 truncate font-medium">{item.label}</span>
                      {showBadge ? (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            active ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-200"
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

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/55 transition hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut size={16} />
          Quitter
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05070d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,84,240,0.18),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(76,139,255,0.08),transparent_40%)]" />

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#05070d]/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-white/10 p-2 text-white/80"
          aria-label="Ouvrir le menu"
        >
          <Menu size={18} />
        </button>
        <p className="font-[family-name:var(--font-syne)] text-sm font-bold tracking-wide">
          Admin ProDay
        </p>
        <div className="w-9" />
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-white/10 bg-[#080b14]">
            <div className="flex items-center justify-end px-3 pt-3">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-white/60 hover:text-white"
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
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-white/10 bg-[#080b14]/80 lg:block">
          {sidebar}
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-[0.22em] text-[#4C8BFF]">
                Admin · ProDay
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-white">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
