"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { navBrandForPath } from "@/components/universe/universeTheme";
import { PRODAY_LOGO_OFFICIAL, PRODAY_OFFICIAL_LOGO_ASPECT } from "@/lib/brandingAssets";
import { isNavActive, poleForPath } from "@/lib/siteArchitecture";
import { POLE_BRAND_HEX, POLES, pricingHrefForPath, type PoleId } from "@/lib/poles";
import { POLE_NAV_ITEMS, ROUTES, UTILITY_NAV_ITEMS } from "@/lib/routes";

const easeOut = [0.22, 1, 0.36, 1] as const;

function NavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 xl:px-3.5 ${
        active ? "text-white" : "text-white/45 hover:text-white"
      }`}
    >
      {label}
      <span
        className={`absolute inset-x-3 -bottom-0.5 h-[2px] origin-left rounded-full bg-[var(--proday-accent)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
        aria-hidden
      />
    </Link>
  );
}

function PolesMegaMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const polesActive = POLE_NAV_ITEMS.some((item) => isNavActive(item.href, pathname));
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const placePanel = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = Math.min(560, window.innerWidth - 24);
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 12,
      left,
      width,
      zIndex: 80,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    placePanel();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };
    const onScroll = () => placePanel();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [close, open, placePanel]);

  const panel = mounted
    ? createPortal(
        <AnimatePresence>
          {open ? (
            <motion.div
              key="univers-menu"
              ref={panelRef}
              id={`${menuId}-menu`}
              role="menu"
              aria-labelledby={`${menuId}-trigger`}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: easeOut }}
              style={panelStyle}
              className="rounded-2xl border border-white/15 bg-[#0a0a0c]/98 p-3 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            >
              <div className="mb-2 flex items-end justify-between px-2 pb-2">
                <div>
                  <p className="font-signature text-lg italic text-white/85">Sept univers</p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                    ProDay · sept pôles
                  </p>
                </div>
                <Link
                  href={ROUTES.pricing}
                  onClick={close}
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--proday-accent)] transition-opacity duration-200 hover:opacity-80"
                >
                  Tarifs <ArrowUpRight size={12} />
                </Link>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {POLES.map((pole) => {
                  const active = isNavActive(pole.href, pathname);
                  const color = POLE_BRAND_HEX[pole.id as PoleId];
                  return (
                    <Link
                      key={pole.id}
                      href={pole.href}
                      role="menuitem"
                      onClick={close}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-[background-color,border-color,transform] duration-200 ${
                        active
                          ? "border-white/20 bg-white/[0.08]"
                          : "border-white/5 hover:border-white/15 hover:bg-white/[0.05] active:scale-[0.99]"
                      }`}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5"
                        style={{ boxShadow: `0 0 0 1px ${color}66` }}
                      >
                        <Image
                          src={pole.logo}
                          alt=""
                          width={36}
                          height={36}
                          className="h-8 w-8 object-contain"
                        />
                      </span>
                      <span className="min-w-0 text-left">
                        <span
                          className="block text-[10px] font-bold uppercase tracking-[0.16em]"
                          style={{ color }}
                        >
                          {pole.kicker.replace("PÔLE ", "")}
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-semibold text-white">
                          {pole.title}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )
    : null;

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
        className={`inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 ${
          polesActive || open ? "text-white" : "text-white/45 hover:text-white"
        }`}
      >
        Univers
        <ChevronDown
          size={13}
          className={`shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {panel}
    </div>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const brand = navBrandForPath(pathname);
  const isHome = pathname === ROUTES.home;
  const currentPole = poleForPath(pathname);
  const accent = currentPole ? POLE_BRAND_HEX[currentPole] : "#0054F0";

  const close = useCallback(() => setOpen(false), []);
  const pricingHref = pricingHrefForPath(pathname);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("nav-lock");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("nav-lock");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#050507]/95 backdrop-blur-lg">
        <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={ROUTES.home} className="group flex items-center gap-2.5">
            <span className="shrink-0 overflow-hidden rounded-lg bg-white p-0.5 shadow-md transition-transform duration-200 group-hover:scale-105">
              <Image
                src={isHome ? PRODAY_LOGO_OFFICIAL : brand.logo}
                alt={isHome ? "ProDay" : brand.name}
                width={isHome ? Math.round(36 * PRODAY_OFFICIAL_LOGO_ASPECT) : 34}
                height={36}
                className="h-9 w-auto"
                priority
              />
            </span>
            <span className="hidden min-w-0 flex-col sm:flex">
              <span className="font-display truncate text-[15px] font-extrabold tracking-[-0.03em] text-white">
                {isHome
                  ? "ProDay"
                  : brand.name.replace(/^Pro Day /, "").replace(/^ProDay /, "")}
              </span>
              <span className="font-signature text-[13px] italic leading-none text-white/40">
                {isHome ? "Connecter · Progresser" : "Univers officiel"}
              </span>
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <div className="flex items-center gap-1">
              <PolesMegaMenu pathname={pathname} />
              {UTILITY_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href === ROUTES.pricing ? pricingHref : item.href}
                  label={item.label}
                  active={pathname === item.href}
                />
              ))}
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Link
              href={ROUTES.demo}
              className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45 transition-colors duration-200 hover:text-white"
            >
              Démo
            </Link>
            <Link
              href={ROUTES.betaWaitlist}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-black transition-[background-color,color,transform] duration-200 hover:bg-[var(--proday-accent)] hover:text-white active:scale-[0.98]"
            >
              Rejoindre la bêta
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <button
            type="button"
            className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white transition-[background-color,border-color,transform] duration-200 hover:bg-white/5 active:scale-95 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.span
                    key="close"
                    initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                    transition={{ duration: 0.16, ease: easeOut }}
                    className="absolute"
                  >
                    <X size={20} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ opacity: 0, rotate: 45, scale: 0.8 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -45, scale: 0.8 }}
                    transition={{ duration: 0.16, ease: easeOut }}
                    className="absolute"
                  >
                    <Menu size={20} />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </button>
        </header>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: easeOut }}
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
              aria-label="Fermer le menu"
              onClick={close}
            />
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.26, ease: easeOut }}
              className="fixed inset-x-3 top-[4.5rem] z-50 max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/12 bg-[#0a0a0c]/98 p-4 shadow-2xl backdrop-blur-xl lg:hidden"
            >
              <p className="font-signature text-xl italic text-white/70">Univers</p>
              <div className="mt-3 grid gap-2">
                {POLES.map((pole, i) => {
                  const color = POLE_BRAND_HEX[pole.id];
                  const active = isNavActive(pole.href, pathname);
                  return (
                    <motion.div
                      key={pole.href}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 + i * 0.025, duration: 0.22, ease: easeOut }}
                    >
                      <Link
                        href={pole.href}
                        onClick={close}
                        className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2.5 transition-[background-color,border-color,transform] duration-200 active:scale-[0.99] ${
                          active
                            ? "border-white/20 bg-white/[0.06]"
                            : "border-white/8 hover:border-white/15 hover:bg-white/[0.04]"
                        }`}
                      >
                        <Image
                          src={pole.logo}
                          alt=""
                          width={32}
                          height={32}
                          className="rounded-md bg-white p-0.5"
                        />
                        <span className="text-sm font-semibold text-white">{pole.title}</span>
                        <span
                          className="ml-auto h-2 w-2 rounded-full"
                          style={{ background: color }}
                        />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-5 border-t border-white/10 pt-4">
                {UTILITY_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href === ROUTES.pricing ? pricingHref : item.href}
                    className={`flex min-h-12 items-center text-sm tracking-wide transition-colors duration-200 ${
                      pathname === item.href
                        ? "font-semibold text-white"
                        : "text-white/65 hover:text-white"
                    }`}
                    onClick={close}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href={ROUTES.demo}
                  className="flex min-h-12 items-center text-sm tracking-wide text-white/65 transition-colors duration-200 hover:text-white"
                  onClick={close}
                >
                  Démo
                </Link>
              </div>
              <Link
                href={ROUTES.betaWaitlist}
                className="mt-4 flex min-h-12 items-center justify-center rounded-full bg-white text-sm font-bold uppercase tracking-[0.14em] text-black transition-[transform,background-color] duration-200 active:scale-[0.98] hover:bg-[var(--proday-accent)] hover:text-white"
                onClick={close}
              >
                Rejoindre la bêta
              </Link>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
