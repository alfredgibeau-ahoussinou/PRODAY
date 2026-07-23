"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/content";
import { ROUTES } from "@/lib/routes";
import { POLES, POLE_BRAND_HEX, type PoleId } from "@/lib/poles";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { Kicker } from "@/components/ui/Kicker";
import { HeroVideoBackground } from "@/components/HeroVideoBackground";
import { PRODAY_LOGO_OFFICIAL, PRODAY_OFFICIAL_LOGO_ASPECT } from "@/lib/brandingAssets";

const HERO_LABELS: Record<PoleId, string> = {
  amateur: "Amateur",
  supporter: "Supporter",
  sante: "Santé",
  pro_joueur: "Pro Joueur",
  pro_club: "Pro Club",
  pro_staff: "Pro Staff",
  sponsor: "Partenaires",
};

const HERO_SLIDES = POLES.map((pole, i) => ({
  num: String(i + 1).padStart(2, "0"),
  label: HERO_LABELS[pole.id],
  href: pole.href,
  color: POLE_BRAND_HEX[pole.id],
}));

const QUICK_LINKS = [
  { href: "#decouvrir", label: "Quiz pôle" },
  { href: ROUTES.demo, label: "Démo" },
  { href: ROUTES.pricing, label: "Tarifs" },
  { href: ROUTES.features, label: "Fonctionnalités" },
  { href: ROUTES.faq, label: "FAQ" },
] as const;

export function HeroSection() {
  return (
    <section className="relative max-h-[100dvh] min-h-[100dvh] overflow-hidden noise lg:max-h-none lg:min-h-screen">
      <div className="absolute inset-0">
        <HeroVideoBackground
          sources={["/videos/hero-stadium.mp4", "/videos/hero-match.mp4"]}
          poster="/images/football-stadium-night-01.jpg"
          opacity={0.92}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_18%_40%,rgba(0,84,240,0.28),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_85%_20%,rgba(0,24,84,0.45),transparent)]" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 hero-overlay-mobile md:hidden" />
        <div className="absolute inset-0 hero-overlay-side hidden md:block" />
      </div>

      <div className="relative mx-auto flex max-h-[100dvh] min-h-[100dvh] max-w-7xl flex-col px-4 text-center sm:px-6 lg:max-h-none lg:min-h-screen lg:flex-row lg:items-end lg:justify-between lg:pb-24 lg:pt-32 lg:text-left">
        <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center pb-36 pt-16 text-center sm:pb-40 sm:pt-20 lg:mx-0 lg:flex-none lg:items-start lg:justify-end lg:pb-8 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_20px_60px_-20px_rgba(0,84,240,0.55)] ring-1 ring-white/20"
          >
            <Image
              src={PRODAY_LOGO_OFFICIAL}
              alt="ProDay"
              width={Math.round(56 * PRODAY_OFFICIAL_LOGO_ASPECT)}
              height={56}
              className="h-14 w-auto sm:h-16"
              priority
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <Kicker>{BRAND.tagline}</Kicker>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="font-display mt-5 text-[clamp(2.5rem,9vw,5.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.035em] sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            <span className="text-shimmer">L&apos;heure</span>
            <br />
            <span className="text-white">de jouer</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/65 sm:mt-6 sm:text-lg lg:mx-0"
          >
            {BRAND.mission}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.55 }}
            className="mt-6 flex flex-wrap justify-center gap-2 sm:mt-8 sm:gap-3 lg:justify-start"
          >
            <PremiumButton href="#inscription" className="cta-lift glow-cyan">
              Accès anticipé
            </PremiumButton>
            <PremiumButton href="#decouvrir" variant="outline">
              Trouver mon pôle
            </PremiumButton>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.62 }}
            aria-label="Explorer ProDay"
            className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 sm:mt-6 lg:justify-start"
          >
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="group relative text-xs font-semibold uppercase tracking-[0.14em] text-white/55 transition hover:text-[var(--proday-accent)]"
              >
                {link.label}
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-[var(--proday-accent)] transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </motion.nav>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.55 }}
          className="absolute inset-x-0 bottom-0 scroll-snap-x flex w-full shrink-0 gap-2 overflow-x-auto px-4 pb-6 sm:pb-8 lg:hidden"
          aria-label="Les 7 pôles ProDay"
        >
          {HERO_SLIDES.map((slide) => (
            <Link
              key={slide.num}
              href={slide.href}
              className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-white/12 bg-black/50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white/80 backdrop-blur-md transition hover:border-white/30 hover:text-white"
              style={{ boxShadow: `inset 0 -2px 0 ${slide.color}` }}
            >
              <span className="font-display text-lg tabular-nums" style={{ color: slide.color }}>
                {slide.num}
              </span>
              {slide.label}
            </Link>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.65 }}
          className="mt-12 hidden flex-col items-end gap-0.5 lg:mt-0 lg:flex"
          aria-label="Les 7 pôles ProDay — desktop"
        >
          {HERO_SLIDES.map((slide) => (
            <Link
              key={slide.num}
              href={slide.href}
              className="group flex items-center gap-4 py-2 text-white/35 transition hover:text-white/80"
            >
              <span
                className="font-display text-2xl font-bold tabular-nums tracking-tight transition group-hover:scale-105"
                style={{ color: slide.color }}
              >
                {slide.num}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] opacity-0 transition duration-300 group-hover:opacity-100">
                {slide.label}
              </span>
            </Link>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 sm:block"
      >
        <Link
          href="#decouvrir"
          className="flex flex-col items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--proday-accent)]/60 transition hover:text-[var(--proday-accent)]"
        >
          Découvrir
          <ArrowRight size={14} className="rotate-90 animate-float" />
        </Link>
      </motion.div>
    </section>
  );
}
