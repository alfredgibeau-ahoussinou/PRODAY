"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Download, HelpCircle, Home } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: ROUTES.betaProgramme, label: "Accueil", icon: Home, exact: true },
  { href: ROUTES.betaProgramme, label: "Programme", icon: BookOpen, exact: false },
  { href: ROUTES.betaInstaller, label: "Installer", icon: Download, exact: false },
  { href: ROUTES.betaAide, label: "Aide", icon: HelpCircle, exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BetaMiniSiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation bêta" className="w-full">
      {/* Tabs mobile / tablette */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-px lg:hidden">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition",
                active
                  ? "border-[var(--proday-accent)] text-[var(--proday-accent)]"
                  : "border-transparent text-white/50 hover:text-white/80",
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Nav latérale desktop */}
      <ul className="hidden space-y-1 lg:block">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact);
          return (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-[var(--proday-accent)]/10 text-[var(--proday-accent)]"
                    : "text-white/55 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <Icon size={18} className={active ? "text-[var(--proday-accent)]" : "text-white/40"} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
