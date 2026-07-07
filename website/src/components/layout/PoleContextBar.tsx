"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { POLE_STYLES } from "@/lib/poles";
import { pageMetaForPath, poleHubForPath, POLE_HUB_LABELS } from "@/lib/siteArchitecture";

export function PoleContextBar() {
  const pathname = usePathname();
  const meta = pageMetaForPath(pathname);
  const hub = poleHubForPath(pathname);

  if (!meta.poleId || !hub) return null;

  const styles = POLE_STYLES[meta.poleId];
  const hubLabel = POLE_HUB_LABELS[hub] ?? "Hub pôle";
  const isHub = pathname === hub;
  const siblings = meta.siblingLinks ?? [];

  if (isHub && siblings.length === 0) return null;

  return (
    <div className="border-b border-white/8 bg-[#050505]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        {!isHub && (
          <>
            <Link
              href={hub}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 ${styles.badge}`}
            >
              ← {hubLabel}
            </Link>
            {siblings.length > 0 && (
              <ChevronRight size={14} className="text-white/30" aria-hidden />
            )}
          </>
        )}
        {isHub && (
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${styles.badge}`}>
            {hubLabel}
          </span>
        )}
        {siblings.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? styles.navActive
                  : "text-white/50 ring-1 ring-white/10 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
