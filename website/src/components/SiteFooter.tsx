"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/content";
import { PRODAY_LOGO_OFFICIAL } from "@/lib/brandingAssets";
import { pricingHrefForPath } from "@/lib/poles";
import { POLE_FOOTER_LINKS, ROUTES } from "@/lib/routes";

const EXPLORE = [
  { href: ROUTES.demo, label: "Démo" },
  { href: ROUTES.cards, label: "Cartes" },
  { href: ROUTES.features, label: "Fonctionnalités" },
  { href: ROUTES.pricing, label: "Tarifs" },
  { href: ROUTES.faq, label: "FAQ" },
  { href: ROUTES.betaWaitlist, label: "Liste d'attente" },
  { href: ROUTES.parent, label: "Espace Parent" },
  { href: ROUTES.trust, label: "Confiance" },
] as const;

export function SiteFooter() {
  const pathname = usePathname();
  const pricingHref = pricingHrefForPath(pathname);
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 bg-[#030303] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-20">
        <div className="flex flex-col gap-10 border-b border-white/10 pb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#4C8BFF]">
              ProDay
            </p>
            <p className="mt-4 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.035em] text-white">
              L&apos;OS du foot.
              <br />
              Amateur &amp; semi-pro.
            </p>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/45">
              Un système pour connecter joueurs, clubs, staff, santé, événements et
              sponsors.
            </p>
          </div>
          <Link
            href={ROUTES.betaWaitlist}
            className="bg-accent-gradient inline-flex min-h-12 w-fit items-center justify-center rounded-full px-7 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:brightness-110"
          >
            Rejoindre la bêta
          </Link>
        </div>

        <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr]">
          <div>
            <Link href={ROUTES.home} className="inline-flex items-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5 p-1.5">
                <Image
                  src={PRODAY_LOGO_OFFICIAL}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="font-display text-lg font-medium tracking-[-0.02em]">
                {BRAND.name}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/40">
              {BRAND.tagline}
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
              Pôles
            </p>
            <ul className="mt-5 space-y-3">
              {POLE_FOOTER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/60 transition hover:text-[#4C8BFF]"
                  >
                    {l.label.replace(/^Pôle\s+/i, "")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
              Explorer
            </p>
            <ul className="mt-5 space-y-3">
              {EXPLORE.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href === ROUTES.pricing ? pricingHref : l.href}
                    className="text-sm text-white/60 transition hover:text-[#4C8BFF]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">
            © {year} ProDay
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href={ROUTES.privacy}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35 transition hover:text-white/70"
            >
              Confidentialité
            </Link>
            <Link
              href={ROUTES.terms}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35 transition hover:text-white/70"
            >
              CGU
            </Link>
            <Link
              href={ROUTES.about}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35 transition hover:text-white/70"
            >
              À propos
            </Link>
            <Link
              href={ROUTES.admin}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35 transition hover:text-white/70"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
