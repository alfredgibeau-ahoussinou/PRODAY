import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/content";
import { NAV_ITEMS, ROUTES } from "@/lib/routes";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/branding/logo-light.png"
                alt={BRAND.name}
                width={36}
                height={36}
              />
              <div>
                <p className="font-bold">{BRAND.name}</p>
                <p className="text-xs text-proday-muted">{BRAND.tagline}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-proday-muted">
              Explorer
            </p>
            <ul className="mt-4 space-y-2">
              {NAV_ITEMS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-proday-muted hover:text-proday-ink"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-proday-muted">
              Interactif
            </p>
            <ul className="mt-4 space-y-2 text-sm text-proday-muted">
              <li>
                <Link href={ROUTES.demo} className="hover:text-proday-ink">
                  Démo app
                </Link>
              </li>
              <li>
                <Link href={ROUTES.liveStats} className="hover:text-proday-ink">
                  Live Stats
                </Link>
              </li>
              <li>
                <Link href={ROUTES.quiz} className="hover:text-proday-ink">
                  Quiz profil
                </Link>
              </li>
              <li>
                <Link href={ROUTES.pricing} className="hover:text-proday-ink">
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-proday-muted">
              Liens
            </p>
            <ul className="mt-4 space-y-2 text-sm text-proday-muted">
              <li>
                <Link
                  href="https://github.com/alfredgibeau-ahoussinou/PRODAY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-proday-ink"
                >
                  GitHub
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-12 border-t border-neutral-100 pt-8 text-center text-sm text-proday-muted">
          © {new Date().getFullYear()} ProDay — Application mobile & web
        </p>
      </div>
    </footer>
  );
}
