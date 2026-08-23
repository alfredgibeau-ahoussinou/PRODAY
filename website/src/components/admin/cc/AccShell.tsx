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
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[var(--acc-line)] px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href={ACC_HOME} className="flex min-h-11 items-center gap-2.5 px-1" onClick={() => setMobileOpen(false)}>
          <span className="acc-mark flex h-8 w-8 items-center justify-center overflow-hidden rounded-md p-1.5">
            <Image src={PRODAY_MARK} alt="" width={24} height={17} className="h-full w-full object-contain" priority />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold tracking-tight text-white">ProDay</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--acc-mute)]">
              Admin Control Center
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 py-2" aria-label="Domaines">
        {ACC_DOMAINS.map((d) => {
          const Icon = DOMAIN_ICONS[d.id] ?? LayoutDashboard;
          const active = domain?.id === d.id;
          return (
            <div key={d.id}>
              <Link
                href={d.href}
                onClick={() => setMobileOpen(false)}
                className={`flex min-h-10 items-center gap-2 rounded-sm px-2.5 py-2 text-[13px] transition ${
                  active
                    ? "bg-[var(--acc-accent-soft)] text-white"
                    : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon size={15} strokeWidth={active ? 2.25 : 2} className="shrink-0 opacity-80" />
                <span className="flex-1 truncate font-medium">{d.label}</span>
                {active ? <ChevronRight size={14} className="opacity-40" /> : null}
              </Link>
              {active && d.items.length > 1 ? (
                <ul className="mb-1 ml-2 space-y-0.5 border-l border-[var(--acc-line)] pl-2">
                  {d.items.map((item) => {
                    const itemActive = pathActive(pathname, item.href);
                    const b = badgeFor(item.badgeKey);
                    return (
                      <li key={item.href + item.label}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex min-h-9 items-center gap-2 px-2 py-1.5 text-[12px] transition ${
                            itemActive ? "text-white" : "text-white/40 hover:text-white/75"
                          }`}
                        >
                          <span className="flex-1 truncate">{item.label}</span>
                          {b != null ? (
                            <span className="min-w-[1.25rem] bg-amber-500/20 px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums text-amber-100">
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

      <div className="space-y-1 border-t border-[var(--acc-line)] p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="flex min-h-10 w-full items-center gap-2.5 px-2.5 text-[12px] text-white/45 transition hover:bg-white/[0.04] hover:text-white"
        >
          <Search size={15} />
          Rechercher
          <span className="ml-auto font-mono text-[9px] text-white/25">⌘K</span>
        </button>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex min-h-10 w-full items-center gap-2.5 px-2.5 text-[12px] text-white/45 transition hover:bg-white/[0.04] hover:text-white"
        >
          <LogOut size={15} />
          Quitter
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
          <div className="hidden items-center justify-between gap-3 border-b border-[var(--acc-line)] px-6 py-2.5 lg:flex">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--acc-mute)]">
              {domain?.label ?? "Admin"} · ProDay
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                className="flex h-8 items-center gap-2 border border-[var(--acc-line)] px-2.5 text-[11px] text-white/45 transition hover:text-white"
              >
                <Search size={13} />
                Commande
                <kbd className="font-mono text-[9px] text-white/25">⌘K</kbd>
              </button>
              <Link
                href="/admin/platform/health"
                className={`flex h-8 items-center gap-2 border border-[var(--acc-line)] px-2.5 font-mono text-[11px] font-semibold tabular-nums ${healthTone}`}
                title={healthLabel ?? "Santé ProDay"}
              >
                <Activity size={13} />
                {healthScore != null ? `${healthScore}%` : "—"}
                {healthLabel ? <span className="font-sans font-normal text-white/35">{healthLabel}</span> : null}
              </Link>
            </div>
          </div>

          <div className="admin-main min-w-0 flex-1 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pt-4 lg:px-6 lg:py-5">
            <div className="hidden lg:block">
              <AccPageHeader title={title} subtitle={subtitle} actions={actions} />
            </div>
            <div className="lg:hidden">
              {(subtitle || actions) && (
                <div className="mb-3 flex flex-col gap-2 border-b border-[var(--acc-line)] pb-3">
                  {subtitle ? <p className="text-xs text-white/45">{subtitle}</p> : null}
                  {actions ? <div className="flex flex-wrap gap-1.5">{actions}</div> : null}
                </div>
              )}
            </div>
            <div className="admin-page space-y-3 sm:space-y-4">{children}</div>
          </div>
        </div>
      </div>

      <AccCommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}

/** Pont legacy : anciens panneaux importent encore AdminShell. */
export { AccShell as AdminShell };
