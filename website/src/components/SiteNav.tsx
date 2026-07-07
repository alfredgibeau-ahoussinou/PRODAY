"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { navBrandForPath } from "@/components/universe/universeTheme";
import { PRODAY_LOGO_ON_DARK } from "@/lib/brandingAssets";
import { isNavActive, poleForPath } from "@/lib/siteArchitecture";
import { POLE_NAV_POLE_IDS, POLE_NAV_STRIPE, POLE_STYLES, type PoleId } from "@/lib/poles";
import { POLE_NAV_ITEMS, ROUTES, UTILITY_NAV_ITEMS } from "@/lib/routes";

function NavLink({
  href,
  label,
  active,
  poleId,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  poleId?: PoleId | null;
  onClick?: () => void;
}) {
  const poleStyle = poleId ? POLE_STYLES[poleId] : null;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative px-3.5 py-2 text-sm font-semibold uppercase tracking-wide transition xl:px-4 ${
        active
          ? poleStyle
            ? `${poleStyle.navActive} text-[var(--proday-accent)]`
            : "text-[var(--proday-accent)]"
          : poleStyle
            ? `${poleStyle.nav} font-medium active:opacity-80`
            : "text-white/55 hover:text-[var(--proday-accent)] active:text-white"
      }`}
    >
      {label}
      {active && (
        <span
          className="absolute inset-x-2 -bottom-0.5 h-px bg-[var(--proday-accent)] shadow-[0_0_8px_var(--proday-accent-glow)]"
          aria-hidden
        />
      )}
    </Link>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const bg = useTransform(
    scrollY,
    [0, 80],
    ["rgba(0, 0, 0, 0.25)", "rgba(0, 0, 0, 0.92)"],
  );
  const border = useTransform(
    scrollY,
    [0, 80],
    ["rgba(34, 211, 238, 0)", "rgba(34, 211, 238, 0.12)"],
  );

  const brand = navBrandForPath(pathname);
  const isHome = pathname === ROUTES.home;
  const currentPole = poleForPath(pathname);
  const currentPoleStyles = currentPole ? POLE_STYLES[currentPole] : null;

  const close = () => setOpen(false);

  return (
    <motion.header
      style={{ backgroundColor: bg, borderBottomColor: border }}
      className={`fixed top-0 z-50 w-full border-b backdrop-blur-md ${
        currentPoleStyles?.accentTop ?? ""
      }`}
    >
      <nav className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6">
        <Link href={ROUTES.home} className="group flex shrink-0 items-center gap-2.5 justify-self-start">
          <Image
            src={isHome ? PRODAY_LOGO_ON_DARK : brand.logo}
            alt={brand.name}
            width={36}
            height={36}
            className="rounded-lg transition group-hover:scale-105"
          />
          <span className="font-display text-lg font-bold tracking-tight text-white">
            {isHome ? "ProDay" : brand.name}
          </span>
        </Link>

        <div className="hidden items-center justify-center xl:flex">
          <ul className="flex items-center gap-1">
            {POLE_NAV_ITEMS.map((l) => (
              <li key={l.href}>
                <NavLink
                  href={l.href}
                  label={l.label}
                  active={isNavActive(l.href, pathname)}
                  poleId={POLE_NAV_POLE_IDS[l.href]}
                />
              </li>
            ))}
          </ul>
          <span className="mx-3 h-4 w-px bg-white/10" aria-hidden />
          <ul className="flex items-center gap-0.5">
            {UTILITY_NAV_ITEMS.map((l) => (
              <li key={l.href}>
                <NavLink
                  href={l.href}
                  label={l.label}
                  active={pathname === l.href}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden shrink-0 items-center gap-3 justify-self-end md:flex">
          <Link
            href={ROUTES.faq}
            className="rounded-full p-2 text-white/50 transition hover:text-[var(--proday-accent)]"
            aria-label="Rechercher"
          >
            <Search size={18} />
          </Link>
          <Link
            href={ROUTES.beta}
            className="rounded-full bg-[var(--proday-accent)] px-5 py-2 text-sm font-bold uppercase tracking-wide text-black transition hover:scale-[1.02] hover:bg-cyan-300 active:bg-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/50"
          >
            Accès anticipé
          </Link>
        </div>

        <button
          type="button"
          className="col-start-3 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-white xl:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-16 z-40 bg-black/90 backdrop-blur-md xl:hidden"
            aria-label="Fermer le menu"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-50 min-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 bg-black/98 px-4 pb-8 backdrop-blur-xl xl:hidden"
          >
            <p className="pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
              6 pôles
            </p>
            {POLE_NAV_ITEMS.map((l) => {
              const poleId = POLE_NAV_POLE_IDS[l.href];
              const styles = POLE_STYLES[poleId];
              const active = isNavActive(l.href, pathname);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex min-h-11 items-center gap-3 rounded-xl py-3 pl-3 pr-4 text-sm transition ${
                    active
                      ? `${styles.navActive} font-semibold text-[var(--proday-accent)]`
                      : "text-white/80 hover:bg-white/5 active:bg-white/10"
                  }`}
                  onClick={close}
                >
                  <span
                    className={`h-8 w-1 shrink-0 rounded-full ${
                      active ? "bg-[var(--proday-accent)]" : POLE_NAV_STRIPE[poleId]
                    }`}
                    aria-hidden
                  />
                  {l.label}
                </Link>
              );
            })}
            <p className="pt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
              Produit
            </p>
            {UTILITY_NAV_ITEMS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex min-h-11 items-center py-3 text-sm ${
                  pathname === l.href
                    ? "font-semibold text-[var(--proday-accent)]"
                    : "text-white/80 hover:text-white"
                }`}
                onClick={close}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={ROUTES.beta}
              className="mt-4 flex min-h-11 items-center justify-center rounded-full bg-[var(--proday-accent)] py-3 text-center text-sm font-bold uppercase tracking-wide text-black transition hover:bg-cyan-300 active:bg-cyan-400"
              onClick={close}
            >
              Accès anticipé
            </Link>
          </motion.div>
        </>
      )}
    </motion.header>
  );
}
