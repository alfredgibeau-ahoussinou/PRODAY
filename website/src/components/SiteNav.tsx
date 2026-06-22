"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
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
      className={`relative rounded-full px-3.5 py-2 text-sm transition xl:px-4 ${
        active
          ? poleStyle
            ? `${poleStyle.navActive} shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]`
            : "bg-white/10 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : poleStyle
            ? `${poleStyle.nav} font-medium`
            : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
      {active && !poleStyle && (
        <span
          className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
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
    ["rgba(3, 3, 3, 0.55)", "rgba(3, 3, 3, 0.94)"],
  );
  const border = useTransform(
    scrollY,
    [0, 80],
    ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.08)"],
  );

  const brand = navBrandForPath(pathname);
  const isHome = pathname === ROUTES.home;
  const currentPole = poleForPath(pathname);
  const currentPoleStyles = currentPole ? POLE_STYLES[currentPole] : null;

  const close = () => setOpen(false);

  return (
    <motion.header
      style={{ backgroundColor: bg, borderBottomColor: border }}
      className={`fixed top-0 z-50 w-full border-b backdrop-blur-xl after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent ${
        currentPoleStyles?.accentTop ?? ""
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={ROUTES.home} className="group flex shrink-0 items-center gap-2.5">
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

        <div className="hidden items-center gap-1 xl:flex">
          <ul className="flex items-center gap-0.5">
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
          <span className="mx-2 h-4 w-px bg-white/15" aria-hidden />
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

        <div className="hidden shrink-0 md:flex">
          <Link
            href={ROUTES.beta}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-neutral-950 transition hover:scale-[1.02] hover:bg-neutral-100"
          >
            Accès anticipé
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-white xl:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-white/10 bg-[#030303]/95 px-4 pb-4 backdrop-blur-xl xl:hidden"
        >
          <p className="pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
            4 pôles
          </p>
          {POLE_NAV_ITEMS.map((l) => {
            const poleId = POLE_NAV_POLE_IDS[l.href];
            const styles = POLE_STYLES[poleId];
            const active = isNavActive(l.href, pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-xl py-3 pl-3 pr-4 text-sm transition ${
                  active
                    ? `${styles.navActive} font-semibold`
                    : "text-white/80 hover:bg-white/5"
                }`}
                onClick={close}
              >
                <span
                  className={`h-8 w-1 shrink-0 rounded-full ${
                    active ? "bg-white/90" : POLE_NAV_STRIPE[poleId]
                  }`}
                  aria-hidden
                />
                {l.label}
              </Link>
            );
          })}
          <p className="pt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Produit
          </p>
          {UTILITY_NAV_ITEMS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block py-3 text-sm ${
                pathname === l.href ? "font-semibold text-white" : "text-white/80"
              }`}
              onClick={close}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={ROUTES.beta}
            className="mt-3 block rounded-full bg-white py-3 text-center text-sm font-semibold text-neutral-950"
            onClick={close}
          >
            Accès anticipé
          </Link>
        </motion.div>
      )}
    </motion.header>
  );
}
