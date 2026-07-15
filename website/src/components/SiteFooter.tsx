"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Link2, Mail, Share2 } from "lucide-react";
import { BRAND } from "@/lib/content";
import { PRODAY_LOGO_OFFICIAL } from "@/lib/brandingAssets";
import { POLE_NAV_POLE_IDS, POLE_NAV_STRIPE, pricingHrefForPath } from "@/lib/poles";
import { POLE_FOOTER_LINKS, ROUTES, UTILITY_NAV_ITEMS } from "@/lib/routes";

const SOCIAL_LINKS = [
  { href: "https://github.com/alfredgibeau-ahoussinou/PRODAY", icon: Link2, label: "GitHub" },
  { href: ROUTES.betaWaitlist, icon: Mail, label: "Contact" },
  { href: ROUTES.home, icon: Share2, label: "Réseaux" },
  { href: ROUTES.home, icon: Globe, label: "Site" },
];

export function SiteFooter() {
  const pathname = usePathname();
  const pricingHref = pricingHrefForPath(pathname);

  return (
    <footer className="border-t border-white/8 bg-black py-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-lg">
            <Image
              src={PRODAY_LOGO_OFFICIAL}
              alt={BRAND.name}
              width={160}
              height={150}
              className="h-auto w-40"
            />
          </div>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/40">
            {BRAND.tagline}
          </p>

          <div className="mt-8 flex items-center gap-5">
            {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
              <Link
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="rounded-full border border-white/10 p-3 text-[var(--proday-accent)] transition hover:border-[var(--proday-accent)] hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                aria-label={label}
              >
                <Icon size={20} />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-10 border-t border-white/8 pt-12 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-3">
          <div className="flex flex-col items-center sm:items-start">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
              Produit
            </p>
            <ul className="mt-4 space-y-2.5">
              {UTILITY_NAV_ITEMS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href === ROUTES.pricing ? pricingHref : l.href}
                    className="text-sm text-white/55 transition hover:text-[var(--proday-accent)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
              6 pôles
            </p>
            <ul className="mt-4 space-y-3">
              {POLE_FOOTER_LINKS.map((pole) => {
                const poleId = POLE_NAV_POLE_IDS[pole.href];
                return (
                  <li key={pole.href}>
                    <Link
                      href={pole.href}
                      className="group flex items-start gap-3 hover:text-[var(--proday-accent)]"
                    >
                      <span
                        className={`mt-1 h-8 w-1 shrink-0 rounded-full ${POLE_NAV_STRIPE[poleId]}`}
                        aria-hidden
                      />
                      <span>
                        <span className="text-sm font-medium text-white/75 group-hover:text-[var(--proday-accent)]">
                          {pole.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-white/35">
                          {pole.subtitle}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
              Ressources
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/55">
              <li>
                <Link href={ROUTES.demo} className="hover:text-[var(--proday-accent)]">
                  Démo interactive
                </Link>
              </li>
              <li>
                <Link href={ROUTES.vision} className="hover:text-[var(--proday-accent)]">
                  Vision
                </Link>
              </li>
              <li>
                <Link href={ROUTES.about} className="hover:text-[var(--proday-accent)]">
                  À propos
                </Link>
              </li>
              <li>
                <Link href={ROUTES.roadmap} className="hover:text-[var(--proday-accent)]">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link href={ROUTES.betaWaitlist} className="hover:text-[var(--proday-accent)]">
                  Liste d&apos;attente
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-white/30">
          © {new Date().getFullYear()} ProDay — Application mobile & web
          <span className="mx-2">·</span>
          <Link href={ROUTES.privacy} className="hover:text-[var(--proday-accent)]">
            Confidentialité
          </Link>
          <span className="mx-2">·</span>
          <Link href={ROUTES.terms} className="hover:text-[var(--proday-accent)]">
            CGU
          </Link>
        </p>
      </div>
    </footer>
  );
}
