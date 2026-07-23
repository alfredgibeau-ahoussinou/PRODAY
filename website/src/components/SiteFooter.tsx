"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Link2, Mail, Share2 } from "lucide-react";
import { BRAND } from "@/lib/content";
import { PRODAY_LOGO_OFFICIAL } from "@/lib/brandingAssets";
import { POLE_BRAND_HEX, POLE_NAV_POLE_IDS, pricingHrefForPath } from "@/lib/poles";
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
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#050507] text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--proday-accent)] to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <div className="inline-flex overflow-hidden rounded-2xl bg-white p-2">
              <Image
                src={PRODAY_LOGO_OFFICIAL}
                alt={BRAND.name}
                width={120}
                height={112}
                className="h-auto w-28"
              />
            </div>
            <p className="font-signature mt-5 text-2xl italic text-white/70">ProDay</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/40">
              {BRAND.tagline}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
                <Link
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="rounded-full border border-white/10 p-2.5 text-white/55 transition hover:border-white/30 hover:text-white"
                  aria-label={label}
                >
                  <Icon size={16} />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">
              Produit
            </p>
            <ul className="mt-5 space-y-3">
              {UTILITY_NAV_ITEMS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href === ROUTES.pricing ? pricingHref : l.href}
                    className="text-sm text-white/60 transition hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">
              Univers
            </p>
            <ul className="mt-5 space-y-3">
              {POLE_FOOTER_LINKS.map((pole) => {
                const poleId = POLE_NAV_POLE_IDS[pole.href];
                const color = POLE_BRAND_HEX[poleId];
                return (
                  <li key={pole.href}>
                    <Link href={pole.href} className="group flex items-center gap-2.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: color }}
                        aria-hidden
                      />
                      <span className="text-sm text-white/60 transition group-hover:text-white">
                        {pole.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">
              Ressources
            </p>
            <ul className="mt-5 space-y-3 text-sm text-white/60">
              <li>
                <Link href={ROUTES.demo} className="hover:text-white">
                  Démo interactive
                </Link>
              </li>
              <li>
                <Link href={ROUTES.vision} className="hover:text-white">
                  Vision
                </Link>
              </li>
              <li>
                <Link href={ROUTES.about} className="hover:text-white">
                  À propos
                </Link>
              </li>
              <li>
                <Link href={ROUTES.roadmap} className="hover:text-white">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link href={ROUTES.betaWaitlist} className="hover:text-white">
                  Liste d&apos;attente
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/8 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} ProDay
            <span className="mx-2">·</span>
            <Link href={ROUTES.privacy} className="hover:text-white/60">
              Confidentialité
            </Link>
            <span className="mx-2">·</span>
            <Link href={ROUTES.terms} className="hover:text-white/60">
              CGU
            </Link>
          </p>
          <p className="font-signature text-xl italic text-white/45">Alfred Ahoussinou</p>
        </div>
      </div>
    </footer>
  );
}
