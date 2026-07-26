"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const SHORTCUTS = [
  {
    id: "joueur",
    label: "Je suis joueur·euse",
    href: ROUTES.proJoueur,
    tone: "#0054F0",
  },
  {
    id: "club",
    label: "Je suis un club",
    href: ROUTES.proClub,
    tone: "#C2410C",
  },
  {
    id: "sante-sponsor",
    label: "Santé / Sponsors",
    href: ROUTES.sante,
    tone: "#0F766E",
  },
] as const;

export function HeroRoleShortcuts() {
  return (
    <section
      aria-label="Quel est ton rôle dans le foot ?"
      className="border-b border-white/10 bg-[#08080c] py-8"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
          Quel est ton rôle dans le foot ?
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {SHORTCUTS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center transition hover:-translate-y-0.5 hover:border-white/25"
            >
              <span
                className="mx-auto mb-3 block h-1 w-10 rounded-full"
                style={{ background: item.tone }}
                aria-hidden
              />
              <span className="font-display text-base font-bold text-white sm:text-lg">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
