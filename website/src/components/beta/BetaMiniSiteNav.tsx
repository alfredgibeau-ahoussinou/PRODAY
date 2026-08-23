"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Download, HelpCircle } from "lucide-react";
import { ProdayLockup } from "@/components/branding/ProdayMark";
import { ROUTES } from "@/lib/routes";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: ROUTES.betaProgramme, label: "Programme", icon: BookOpen },
  { href: ROUTES.betaInstaller, label: "Installer", icon: Download },
  { href: ROUTES.betaAide, label: "Aide", icon: HelpCircle },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BetaMiniSiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation bêta" className="w-full">
      <Link
        href={ROUTES.home}
        className="mb-5 inline-flex rounded-full py-1 pl-0.5 pr-2 transition hover:opacity-90 lg:mb-6"
        aria-label="ProDay, accueil"
      >
        <ProdayLockup className="h-[22px] text-[22px]" />
      </Link>
      <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition",
                active
                  ? "bg-accent-gradient text-white"
                  : "border border-white/15 text-white/55 hover:border-white/30 hover:text-white",
              )}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
