"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

const AUTO_MS = 4500;

export type AppPhoneScreen = {
  id: string;
  src: string;
  label: string;
  caption: string;
};

type AppPhoneShowcaseProps = {
  screens: AppPhoneScreen[];
  className?: string;
  /** Libellé produit pour l’accessibilité (ex. « ProDay Joueur »). */
  productLabel: string;
  /** Label du tablist (ex. « Écrans de l’app Joueur »). */
  tablistLabel: string;
  /**
   * Glow derrière l’appareil — CSS background (radial-gradient…).
   * Défaut : violet Président.
   */
  glowBackground?: string;
};

/**
 * Cadre iPhone réaliste + carrousel crossfade.
 * Thème via screens + glow ; un seul téléphone.
 */
export function AppPhoneShowcase({
  screens,
  className = "",
  productLabel,
  tablistLabel,
  glowBackground = "radial-gradient(ellipse at 50% 40%, rgba(124, 58, 237, 0.35), transparent 65%)",
}: AppPhoneShowcaseProps) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = screens.length;
  const active = screens[index] ?? screens[0]!;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (reduce || paused || count < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduce, paused, count]);

  return (
    <div
      className={`flex flex-col items-center ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.96 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[280px] sm:max-w-[300px]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] opacity-70 blur-2xl"
          style={{ background: glowBackground }}
        />

        <div
          className="relative rounded-[2.55rem] border-[5px] border-neutral-700 bg-neutral-950 p-[5px] shadow-[0_36px_72px_-28px_rgba(0,0,0,0.95)] sm:rounded-[2.75rem] sm:border-[6px] sm:p-1.5 sm:shadow-[0_44px_90px_-22px_rgba(0,0,0,0.95)]"
          role="img"
          aria-label={`Capture ${productLabel} — ${active.label}`}
        >
          <span
            aria-hidden
            className="absolute -left-[7px] top-[18%] h-8 w-[3px] rounded-l-sm bg-neutral-600 sm:-left-[8px]"
          />
          <span
            aria-hidden
            className="absolute -left-[7px] top-[28%] h-12 w-[3px] rounded-l-sm bg-neutral-600 sm:-left-[8px]"
          />
          <span
            aria-hidden
            className="absolute -left-[7px] top-[40%] h-12 w-[3px] rounded-l-sm bg-neutral-600 sm:-left-[8px]"
          />
          <span
            aria-hidden
            className="absolute -right-[7px] top-[32%] h-16 w-[3px] rounded-r-sm bg-neutral-600 sm:-right-[8px]"
          />

          <div className="relative aspect-[471/1024] overflow-hidden rounded-[2.05rem] bg-black sm:rounded-[2.2rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={active.src}
                  alt={`${productLabel} — ${active.label} : ${active.caption}`}
                  fill
                  sizes="(max-width: 640px) 280px, 300px"
                  className="object-cover object-top"
                  priority={active.id === screens[0]?.id}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mt-6 w-full max-w-[300px] text-center"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.id}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--pole-accent,#1E3AFF)]">
              {active.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              {active.caption}
            </p>
          </motion.div>
        </AnimatePresence>

        <div
          className="mt-5 flex flex-wrap items-center justify-center gap-2"
          role="tablist"
          aria-label={tablistLabel}
        >
          {screens.map((screen, i) => {
            const selected = i === index;
            return (
              <button
                key={screen.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={screen.label}
                onClick={() => go(i)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide transition ${
                  selected
                    ? "bg-white text-black"
                    : "bg-white/8 text-white/55 hover:bg-white/12 hover:text-white/80"
                }`}
              >
                {screen.label}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
