import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/content";
import { POLE_NAV_POLE_IDS, POLE_NAV_STRIPE } from "@/lib/poles";
import { POLE_FOOTER_LINKS, ROUTES, UTILITY_NAV_ITEMS } from "@/lib/routes";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#020202] py-16 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <Image
                src="/branding/logo-dark.png"
                alt={BRAND.name}
                width={40}
                height={40}
                className="rounded-xl"
              />
              <div>
                <p className="font-display text-lg font-bold">{BRAND.name}</p>
                <p className="text-xs tracking-widest text-white/40">{BRAND.tagline}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              {BRAND.mission}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Produit
            </p>
            <ul className="mt-4 space-y-2.5">
              {UTILITY_NAV_ITEMS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/60 transition hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              4 pôles
            </p>
            <ul className="mt-4 space-y-3">
              {POLE_FOOTER_LINKS.map((pole) => {
                const poleId = POLE_NAV_POLE_IDS[pole.href];
                return (
                  <li key={pole.href}>
                    <Link
                      href={pole.href}
                      className="group flex items-start gap-3 hover:text-white"
                    >
                      <span
                        className={`mt-1 h-8 w-1 shrink-0 rounded-full ${POLE_NAV_STRIPE[poleId]}`}
                        aria-hidden
                      />
                      <span>
                        <span className="text-sm font-medium text-white/80 group-hover:text-white">
                          {pole.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-white/40">
                          {pole.subtitle}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Ressources
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
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
                <Link href={ROUTES.beta} className="hover:text-white">
                  Liste d&apos;attente
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/alfredgibeau-ahoussinou/PRODAY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  GitHub
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-14 border-t border-white/8 pt-8 text-center text-sm text-white/35">
          © {new Date().getFullYear()} ProDay — Application mobile & web
        </p>
      </div>
    </footer>
  );
}
