"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { POLE_BRAND_HEX, POLE_STYLES } from "@/lib/poles";
import { pageMetaForPath, poleHubForPath, POLE_HUB_LABELS } from "@/lib/siteArchitecture";

export function PoleContextBar() {
  const pathname = usePathname();
  const meta = pageMetaForPath(pathname);
  const hub = poleHubForPath(pathname);

  if (!meta.poleId || !hub) return null;

  const styles = POLE_STYLES[meta.poleId];
  const color = POLE_BRAND_HEX[meta.poleId];
  const hubLabel = POLE_HUB_LABELS[hub] ?? "Hub pôle";
  const isHub = pathname === hub;
  const siblings = meta.siblingLinks ?? [];

  if (isHub && siblings.length === 0) return null;

  return (
    <div className="border-b border-white/8 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-0 sm:px-6">
        {!isHub && (
          <Link
            href={hub}
            className="shrink-0 border-b-2 border-transparent px-3 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45 transition hover:text-white"
          >
            ← {hubLabel}
          </Link>
        )}
        {isHub && (
          <span
            className="shrink-0 border-b-2 px-3 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
            style={{ borderColor: color }}
          >
            {hubLabel}
          </span>
        )}
        {siblings.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 border-b-2 px-3 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                active
                  ? "text-white"
                  : "border-transparent text-white/40 hover:text-white/80"
              }`}
              style={active ? { borderColor: color } : undefined}
            >
              {link.label}
            </Link>
          );
        })}
        <span className={`ml-auto hidden text-[10px] uppercase tracking-[0.2em] sm:inline ${styles.textMuted}`}>
          Navigation pôle
        </span>
      </div>
    </div>
  );
}
