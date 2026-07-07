"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { navBrandForPath } from "@/components/universe/universeTheme";
import { PRODAY_LOGO_OFFICIAL, PRODAY_OFFICIAL_LOGO_ASPECT } from "@/lib/brandingAssets";
import { isNavActive, poleForPath } from "@/lib/siteArchitecture";
import { POLE_NAV_POLE_IDS, POLE_NAV_STRIPE, POLE_STYLES, type PoleId } from "@/lib/poles";
import { POLE_NAV_ITEMS, ROUTES, UTILITY_NAV_ITEMS } from "@/lib/routes";

function NavLink({
  href,
  label,
  active,
  poleId,
  onClick,
  compact = false,
}: {
  href: string;
  label: string;
  active: boolean;
  poleId?: PoleId | null;
  onClick?: () => void;
  compact?: boolean;
}) {
  const poleStyle = poleId ? POLE_STYLES[poleId] : null;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative whitespace-nowrap font-semibold uppercase tracking-wide transition ${
        compact ? "px-2.5 py-2 text-xs xl:px-3 xl:text-sm" : "px-3 py-2 text-sm xl:px-3.5"
      } ${
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
          className="absolute inset-x-1.5 -bottom-0.5 h-px bg-[var(--proday-accent)] shadow-[0_0_8px_var(--proday-accent-glow)]"
          aria-hidden
        />
      )}
    </Link>
  );
}

function PolesDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const polesActive = POLE_NAV_ITEMS.some((item) => isNavActive(item.href, pathname));

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [close, open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={`${menuId}-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${menuId}-menu`}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold uppercase tracking-wide transition xl:px-3 xl:text-sm ${
          polesActive || open
            ? "text-[var(--proday-accent)]"
            : "text-white/55 hover:text-[var(--proday-accent)]"
        }`}
      >
        Pôles
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={`${menuId}-menu`}
          role="menu"
          aria-labelledby={`${menuId}-trigger`}
          className="absolute left-1/2 top-[calc(100%+0.5rem)] z-50 w-56 -translate-x-1/2 rounded-xl border border-white/10 bg-black/95 p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        >
          {POLE_NAV_ITEMS.map((item) => {
            const poleId = POLE_NAV_POLE_IDS[item.href];
            const styles = POLE_STYLES[poleId];
            const active = isNavActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={close}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? `${styles.navActive} font-semibold text-[var(--proday-accent)]`
                    : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`h-6 w-1 shrink-0 rounded-full ${
                    active ? "bg-[var(--proday-accent)]" : POLE_NAV_STRIPE[poleId]
                  }`}
                  aria-hidden
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
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
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6"
        aria-label="Navigation principale"
      >
        <Link
          href={ROUTES.home}
          className="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5"
        >
          {isHome ? (
            <span className="shrink-0 overflow-hidden rounded-lg bg-white p-0.5 shadow-sm transition group-hover:scale-[1.02]">
              <Image
                src={PRODAY_LOGO_OFFICIAL}
                alt="ProDay"
                width={Math.round(40 * PRODAY_OFFICIAL_LOGO_ASPECT)}
                height={40}
                className="h-10 w-auto"
              />
            </span>
          ) : (
            <Image
              src={brand.logo}
              alt={brand.name}
              width={36}
              height={36}
              className="shrink-0 rounded-lg transition group-hover:scale-105"
            />
          )}
          {!isHome && (
            <span className="font-display truncate text-base font-bold tracking-tight text-white sm:text-lg">
              {brand.name}
            </span>
          )}
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
          <ul className="flex items-center gap-0.5 xl:gap-1">
            <li>
              <PolesDropdown pathname={pathname} />
            </li>
            {UTILITY_NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  label={item.label}
                  active={pathname === item.href}
                  compact
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden shrink-0 items-center lg:flex">
          <Link
            href={ROUTES.betaWaitlist}
            className="rounded-full bg-[var(--proday-accent)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-black transition hover:scale-[1.02] hover:bg-cyan-300 active:bg-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/50 xl:px-5 xl:text-sm"
          >
            Accès anticipé
          </Link>
        </div>

        <button
          type="button"
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/5 lg:hidden"
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
            className="fixed inset-0 top-16 z-40 bg-black/90 backdrop-blur-md lg:hidden"
            aria-label="Fermer le menu"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-50 min-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 bg-black/98 px-4 pb-8 backdrop-blur-xl lg:hidden"
          >
            <p className="pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
              6 pôles
            </p>
            {POLE_NAV_ITEMS.map((item) => {
              const poleId = POLE_NAV_POLE_IDS[item.href];
              const styles = POLE_STYLES[poleId];
              const active = isNavActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
                  {item.label}
                </Link>
              );
            })}
            <p className="pt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
              Produit
            </p>
            {UTILITY_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 items-center py-3 text-sm ${
                  pathname === item.href
                    ? "font-semibold text-[var(--proday-accent)]"
                    : "text-white/80 hover:text-white"
                }`}
                onClick={close}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={ROUTES.betaWaitlist}
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
