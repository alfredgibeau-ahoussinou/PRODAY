"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { BRAND } from "@/lib/content";
import { ROUTES } from "@/lib/routes";
import { CAROUSEL_POLES, poleSectionHref } from "@/lib/poles";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { Kicker } from "@/components/ui/Kicker";

const HERO_LABELS = [
  "Amateur",
  "Supporter",
  "Santé",
  "Pro Joueur",
  "Pro Club",
  "Pro Staff",
] as const;

const HERO_SLIDES = CAROUSEL_POLES.map((pole, i) => ({
  num: String(i + 1).padStart(2, "0"),
  label: HERO_LABELS[i] ?? pole.title,
  href: poleSectionHref(pole),
}));

export function HeroSection() {
  return (
    <section className="relative max-h-[100dvh] min-h-[100dvh] overflow-hidden lg:max-h-none lg:min-h-screen">
      <div className="absolute inset-0">
        <Image
          src="/images/football-stadium-night-01.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 hero-overlay-mobile md:hidden" />
        <div className="absolute inset-0 hero-overlay-side hidden md:block" />
      </div>

      <div className="relative mx-auto flex max-h-[100dvh] min-h-[100dvh] max-w-7xl flex-col justify-end px-4 pb-14 pt-24 text-center sm:px-6 sm:pb-20 sm:pt-28 lg:max-h-none lg:min-h-screen lg:flex-row lg:items-end lg:justify-between lg:pb-24 lg:pt-32 lg:text-left">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Kicker>{BRAND.tagline}</Kicker>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="font-display mt-5 text-[clamp(2.25rem,8vw,5rem)] font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            <span className="text-[var(--proday-accent)] text-accent-glow">L&apos;heure</span>
            <br />
            <span className="text-white">de jouer</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/70 sm:mt-6 sm:text-lg lg:mx-0"
          >
            {BRAND.mission}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-6 flex flex-wrap justify-center gap-2 sm:mt-9 sm:gap-3 lg:justify-start"
          >
            <PremiumButton href={ROUTES.betaWaitlist}>Accès anticipé</PremiumButton>
            <PremiumButton href={poleSectionHref(CAROUSEL_POLES[0]!)} variant="outline">
              Pôle Amateur
            </PremiumButton>
            <PremiumButton href={ROUTES.demo} variant="outline">
              <Play size={15} fill="currentColor" />
              Voir la démo
            </PremiumButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-5 hidden flex-wrap gap-2 sm:mt-8 sm:flex"
          >
            {["Profil & carrière", "Mercato", "Journal activités", "Arena", "Partenaires"].map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ),
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="scroll-snap-x -mx-4 mt-6 flex w-full gap-2 overflow-x-auto px-4 pb-1 lg:hidden"
          aria-label="Les 6 pôles ProDay"
        >
          {HERO_SLIDES.map((slide, i) => (
            <Link
              key={slide.num}
              href={slide.href}
              className={`flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                i === 0
                  ? "border-[var(--proday-accent)]/50 bg-[var(--proday-accent-muted)] text-[var(--proday-accent)]"
                  : "border-white/10 bg-black/40 text-white/60 hover:border-white/25 hover:text-white"
              }`}
            >
              <span className="font-display text-lg tabular-nums">{slide.num}</span>
              {slide.label}
            </Link>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-12 hidden flex-col items-end gap-1 lg:mt-0 lg:flex"
          aria-label="Les 6 pôles ProDay — desktop"
        >
          {HERO_SLIDES.map((slide, i) => (
            <Link
              key={slide.num}
              href={slide.href}
              className={`group flex items-center gap-4 py-2 transition ${
                i === 0 ? "text-[var(--proday-accent)]" : "text-white/35 hover:text-white/70"
              }`}
            >
              <span className="font-display text-2xl font-bold tabular-nums">{slide.num}</span>
              <span className="text-xs font-semibold uppercase tracking-widest opacity-0 transition group-hover:opacity-100">
                {slide.label}
              </span>
            </Link>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 sm:block">
        <Link
          href="#decouvrir"
          className="flex flex-col items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--proday-accent)]/60 transition hover:text-[var(--proday-accent)]"
        >
          Découvrir
          <ArrowRight size={14} className="rotate-90" />
        </Link>
      </div>
    </section>
  );
}
