"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  Bot,
  Building2,
  ChevronRight,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Search,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-react";
import { AccCommandPalette } from "@/components/admin/cc/AccCommandPalette";
import { AccPageHeader } from "@/components/admin/cc/AccUi";
import { ACC_DOMAINS, ACC_HOME, findAccDomain } from "@/lib/adminCc/nav";
import { PRODAY_MARK } from "@/lib/brandingAssets";

const DOMAIN_ICONS: Record<string, typeof LayoutDashboard> = {
  home: LayoutDashboard,
  platform: Activity,
  users: Users,
  clubs: Building2,
  commercial: FileText,
  finances: CreditCard,
  product: Package,
  ai: Bot,
  communication: MessageSquare,
  support: MessageSquare,
  content: FileText,
  security: Shield,
  system: Zap,
};

type BadgeCounts = {
  pendingBeta?: number;
  actionRequired?: number;
  pastDue?: number;
};

type Props = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  badges?: BadgeCounts;
  /** Legacy AdminShell prop */
  pendingBetaCount?: number;
  healthScore?: number | null;
  healthLabel?: string | null;
};

function pathActive(pathname: string, href: string): boolean {
  const base = href.split("?")[0];
  if (pathname === base) return true;
  if (base !== ACC_HOME && pathname.startsWith(`${base}/`)) return true;
  return false;
}

export function AccShell({
  children,
  title,
  subtitle,
  actions,
  badges: badgesProp = {},
  pendingBetaCount,
  healthScore = null,
  healthLabel = null,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const domain = useMemo(() => findAccDomain(pathname), [pathname]);
  const badges: BadgeCounts = {
    ...badgesProp,
    pendingBeta: badgesProp.pendingBeta ?? pendingBetaCount,
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  function badgeFor(key?: "pendingBeta" | "actionRequired" | "pastDue") {
    if (key === "pendingBeta" && (badges.pendingBeta ?? 0) > 0) return badges.pendingBeta;
    if (key === "pastDue" && (badges.pastDue ?? 0) > 0) return badges.pastDue;
    if (key === "actionRequired" && (badges.actionRequired ?? 0) > 0) {
      return badges.actionRequired;
    }
    return null;
  }

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col bg-[#080b13]/80 backdrop-blur-xl">
      <div className="border-b border-[var(--acc-line)] px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link href={ACC_HOME} className="group flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <span className="acc-mark flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg p-1.5 transition-transform group-hover:scale-105">
            <Image src={PRODAY_MARK} alt="" width={24} height={24} className="h-full w-full object-contain" priority />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-bold tracking-tight text-white">ProDay</p>
              <span className="rounded bg-amber-400/20 px-1 py-0.2 font-mono text-[9px] font-bold text-amber-300">
                PRO
              </span>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--acc-mute)]">
              Control Center
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-3" aria-label="Domaines">
        {ACC_DOMAINS.map((d) => {
          const Icon = DOMAIN_ICONS[d.id] ?? LayoutDashboard;
          const active = domain?.id === d.id;
          return (
            <div key={d.id} className="space-y-0.5">
              <Link
                href={d.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition-all ${
                  active
                    ? "bg-gradient-to-r from-blue-600/30 to-indigo-600/10 text-white shadow-sm ring-1 ring-blue-500/30"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon
                  size={16}
                  strokeWidth={active ? 2.5 : 2}
                  className={`shrink-0 transition-colors ${
                    active ? "text-blue-400" : "text-white/40 group-hover:text-white/80"
                  }`}
                />
                <span className="flex-1 truncate">{d.label}</span>
                {active ? <ChevronRight size={13} className="text-blue-400/70" /> : null}
              </Link>
              {active && d.items.length > 1 ? (
                <ul className="my-1 ml-4 space-y-0.5 border-l border-blue-500/20 pl-2.5">
                  {d.items.map((item) => {
                    const itemActive = pathActive(pathname, item.href);
                    const b = badgeFor(item.badgeKey);
                    return (
                      <li key={item.href + item.label}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex min-h-8 items-center gap-2 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                            itemActive
                              ? "bg-white/[0.06] text-white"
                              : "text-white/40 hover:bg-white/[0.02] hover:text-white/80"
                          }`}
                        >
                          <span className="flex-1 truncate">{item.label}</span>
                          {b != null ? (
                            <span className="min-w-[1.25rem] rounded-full bg-amber-500/20 px-1.5 py-0.5 text-center font-mono text-[9px] font-bold tabular-nums text-amber-200 ring-1 ring-amber-500/40">
                              {b}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="space-y-1.5 border-t border-[var(--acc-line)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="flex min-h-9 w-full items-center gap-2.5 rounded-lg border border-[var(--acc-line)] bg-white/[0.02] px-3 text-xs font-medium text-white/50 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          <Search size={14} className="text-white/40" />
          <span>Recherche rapide</span>
          <kbd className="ml-auto rounded border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-white/40">⌘K</kbd>
        </button>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex min-h-9 w-full items-center gap-2.5 rounded-lg px-3 text-xs font-medium text-white/40 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut size={14} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  const healthTone =
    healthScore == null
      ? "text-white/40"
      : healthScore >= 75
        ? "text-teal-300"
        : healthScore >= 55
          ? "text-amber-300"
          : "text-rose-300";

  return (
    <div className="acc-shell admin-shell relative min-h-screen bg-[var(--acc-bg)] text-white">
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--acc-line)] bg-[var(--acc-bg)]/95 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--acc-line)] text-white/75"
          aria-label="Ouvrir le menu"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">{title}</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--acc-mute)]">
            Control Center
          </p>
        </div>
        {healthScore != null ? (
          <Link href="/admin/platform/health" className={`font-mono text-[11px] font-bold tabular-nums ${healthTone}`}>
            {healthScore}%
          </Link>
        ) : null}
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/70" aria-label="Fermer" onClick={() => setMobileOpen(false)} />
          <aside className="admin-drawer absolute inset-y-0 left-0 flex w-[min(300px,90vw)] flex-col border-r border-[var(--acc-line)] bg-[var(--acc-bg)] shadow-2xl">
            <div className="absolute right-1 top-[max(0.25rem,env(safe-area-inset-top))] z-10">
              <button type="button" onClick={() => setMobileOpen(false)} className="flex h-10 w-10 items-center justify-center text-white/50" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1680px]">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-[var(--acc-line)] bg-[var(--acc-bg)] lg:block">
          {sidebar}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="hidden items-center justify-between gap-3 border-b border-[var(--acc-line)] bg-[#070a12]/60 px-8 py-3 backdrop-blur-md lg:flex">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--acc-mute)]">
                Admin
              </span>
              <span className="text-white/20">/</span>
              <span className="text-xs font-semibold text-white/90">
                {domain?.label ?? "Control Center"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                className="flex h-8 items-center gap-2 rounded-lg border border-[var(--acc-line)] bg-white/[0.02] px-3 text-xs text-white/50 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              >
                <Search size={13} className="text-white/40" />
                <span>Recherche</span>
                <kbd className="rounded border border-white/10 bg-black/40 px-1 font-mono text-[9px] text-white/30">⌘K</kbd>
              </button>
              <Link
                href="/admin/platform/health"
                className={`flex h-8 items-center gap-2 rounded-lg border border-[var(--acc-line)] bg-white/[0.02] px-3 font-mono text-xs font-semibold tabular-nums transition hover:bg-white/[0.05] ${healthTone}`}
                title={healthLabel ?? "Santé ProDay"}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
                </span>
                {healthScore != null ? `${healthScore}%` : "100%"}
                {healthLabel ? <span className="font-sans font-normal text-white/40">{healthLabel}</span> : null}
              </Link>
            </div>
          </div>

          <div className="admin-main min-w-0 flex-1 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:py-6">
            <div className="hidden lg:block">
              <AccPageHeader title={title} subtitle={subtitle} actions={actions} />
            </div>
            <div className="lg:hidden">
              {(subtitle || actions) && (
                <div className="mb-4 flex flex-col gap-2.5 border-b border-[var(--acc-line)] pb-4">
                  {subtitle ? <p className="text-xs text-white/50">{subtitle}</p> : null}
                  {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
                </div>
              )}
            </div>
            <div className="admin-page space-y-4 sm:space-y-6">{children}</div>
          </div>
        </div>
      </div>

      <AccCommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}

/** Pont legacy : anciens panneaux importent encore AdminShell. */
export { AccShell as AdminShell };
