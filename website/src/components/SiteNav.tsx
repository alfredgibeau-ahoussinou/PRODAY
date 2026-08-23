"use client";

import { AnimatePresence, motion } from "framer-motion";
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
import { ChevronDown, Menu, X } from "lucide-react";
import { ProdayLockup } from "@/components/branding/ProdayMark";
import { isNavActive } from "@/lib/siteArchitecture";
import { POLE_BRAND_HEX, SHOWCASE_POLES, pricingHrefForPath } from "@/lib/poles";
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
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-3.5 py-2 text-[13px] font-medium tracking-[-0.01em] transition-colors ${
        active
          ? "text-white underline decoration-[var(--proday-accent,#E8B923)] decoration-2 underline-offset-[6px]"
          : "text-white/55 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function PolesMegaMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const polesActive = POLE_NAV_ITEMS.some((item) =>
    isNavActive(item.href, pathname),
  );
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => setMounted(true), []);

  const placePanel = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = Math.min(480, window.innerWidth - 24);
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onClick = (e: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest?.("[data-poles-panel]")
      ) {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    window.addEventListener("resize", placePanel);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("resize", placePanel);
    };
  }, [open, close, placePanel]);

  const panel =
    mounted && open
      ? createPortal(
          <AnimatePresence>
            <motion.div
              data-poles-panel
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: easeOut }}
              style={panelStyle}
              className="overflow-hidden rounded-2xl border border-white/12 bg-[#0a0a0a]/92 p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
              role="menu"
            >
              <div className="grid gap-0.5 sm:grid-cols-2">
                {SHOWCASE_POLES.map((pole) => {
                  const color = POLE_BRAND_HEX[pole.id];
                  const active = isNavActive(pole.href, pathname);
                  return (
                    <Link
                      key={pole.href}
                      href={pole.href}
                      role="menuitem"
                      onClick={close}
                      className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-white/10 hover:bg-white/[0.06]"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: color }}
                      />
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: active ? color : "rgba(255,255,255,0.9)" }}
                      >
                        {pole.navLabel}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={`${menuId}-menu`}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium tracking-[-0.01em] transition-colors ${
          polesActive || open
            ? "text-white"
            : "text-white/55 hover:text-white"
        }`}
      >
        Pôles
        <ChevronDown
          size={13}
          className={`opacity-70 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {panel}
    </div>
  );
}

/** Terminal-style floating capsule nav */
export function SiteNav({ light: _light }: { light?: boolean } = {}) {
  void _light;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pricingHref = pricingHrefForPath(pathname);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("nav-lock");
    return () => document.body.classList.remove("nav-lock");
  }, [open]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[110] flex justify-center px-3 pt-3 sm:px-5 sm:pt-5">
        <nav
          aria-label="Principal"
          className={`site-nav-dock pointer-events-auto flex w-full max-w-[52rem] items-center gap-1 rounded-full pl-2 pr-2 py-1 sm:gap-1 sm:pl-2.5 sm:pr-2 sm:py-1.5 ${
            scrolled ? "is-scrolled" : ""
          }`}
        >
          <Link
            href={ROUTES.home}
            className="flex shrink-0 items-center rounded-full py-1 pl-1.5 pr-2"
            aria-label="ProDay, accueil"
          >
            <ProdayLockup width={108} priority className="h-[22px] w-auto min-[390px]:h-[24px]" />
          </Link>

          <div className="mx-auto hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex">
            <PolesMegaMenu pathname={pathname} />
            {UTILITY_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href === ROUTES.pricing ? pricingHref : item.href}
                label={item.label}
                active={pathname === item.href}
              />
            ))}
            <NavLink
              href={ROUTES.demo}
              label="Démo"
              active={pathname === ROUTES.demo}
            />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href={ROUTES.betaWaitlist}
              className="bg-accent-gradient hidden items-center rounded-full px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-black transition hover:brightness-110 md:inline-flex"
            >
              Tester
            </Link>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-white/80 transition hover:bg-white/10 hover:text-white min-[390px]:h-10 min-[390px]:w-10 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Fermer" : "Menu"}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[105] bg-black/75 md:hidden"
              aria-label="Fermer"
              onClick={close}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: easeOut }}
              className="fixed inset-x-3 top-[4.4rem] z-[110] max-h-[calc(100dvh-5.3rem)] overflow-y-auto rounded-[1.5rem] border border-white/10 bg-[#0a0a0a]/88 p-3.5 shadow-[0_24px_60px_-26px_rgba(0,0,0,0.85)] backdrop-blur-2xl min-[390px]:rounded-[1.75rem] min-[390px]:p-4 md:hidden"
            >
              <div className="rounded-2xl border border-white/10 p-2">
                <p className="px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                  Pôles
                </p>
                <div className="mt-2 grid gap-0.5">
                  {SHOWCASE_POLES.map((pole) => {
                    const color = POLE_BRAND_HEX[pole.id];
                    const active = isNavActive(pole.href, pathname);
                    return (
                      <Link
                        key={pole.href}
                        href={pole.href}
                        onClick={close}
                        className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-[15px] font-medium transition hover:border-white/10 hover:bg-white/[0.06]"
                        style={{ color: active ? color : "rgba(255,255,255,0.9)" }}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: color }}
                        />
                        {pole.navLabel}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 p-2">
                <p className="px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                  Navigation
                </p>
                <div className="mt-2">
                  {UTILITY_NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href === ROUTES.pricing ? pricingHref : item.href}
                      onClick={close}
                      className="flex min-h-11 items-center rounded-xl border border-transparent px-3 text-[15px] text-white/70 transition hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href={ROUTES.demo}
                    onClick={close}
                    className="flex min-h-11 items-center rounded-xl border border-transparent px-3 text-[15px] text-white/70 transition hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
                  >
                    Démo
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <Link
                  href={ROUTES.betaWaitlist}
                  onClick={close}
                  className="bg-accent-gradient flex min-h-12 items-center justify-center rounded-full text-[12px] font-semibold uppercase tracking-[0.12em] text-black"
                >
                  Tester
                </Link>
                <Link
                  href={ROUTES.demo}
                  onClick={close}
                  className="flex min-h-11 items-center justify-center rounded-full border border-white/20 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80 transition hover:border-white/40 hover:text-white"
                >
                  Ouvrir la démo
                </Link>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
