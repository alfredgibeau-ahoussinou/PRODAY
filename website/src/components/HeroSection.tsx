"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/content";
import { POLES, POLE_BRAND_HEX, type PoleId } from "@/lib/poles";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { HeroVideoBackground } from "@/components/HeroVideoBackground";
import { PRODAY_LOGO_OFFICIAL, PRODAY_OFFICIAL_LOGO_ASPECT } from "@/lib/brandingAssets";
import { ROUTES } from "@/lib/routes";

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
  logo: pole.logo,
}));

export function HeroSection() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-hidden lg:min-h-screen">
      <div className="absolute inset-0">
        <HeroVideoBackground
          sources={["/videos/hero-stadium.mp4", "/videos/hero-match.mp4"]}
          poster="/images/football-stadium-night-01.jpg"
          opacity={1}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_30%,rgba(0,84,240,0.2),transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 pb-36 pt-28 text-center sm:px-6 sm:pb-40 sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_20px_60px_-20px_rgba(0,84,240,0.55)]"
        >
          <Image
            src={PRODAY_LOGO_OFFICIAL}
            alt=""
            width={Math.round(56 * PRODAY_OFFICIAL_LOGO_ASPECT)}
            height={56}
            className="h-14 w-auto sm:h-16"
            priority
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[clamp(2.75rem,10vw,6rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-shimmer"
        >
          {BRAND.name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.6 }}
          className="font-display mx-auto mt-5 max-w-2xl text-balance text-[clamp(1.15rem,3.2vw,1.65rem)] font-bold leading-snug tracking-[-0.02em] text-white"
        >
          {BRAND.mission}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
          className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/65 sm:text-lg"
        >
          {BRAND.heroSupport}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46, duration: 0.55 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <PremiumButton
            href="#inscription"
            className="!bg-white !text-black hover:!bg-[var(--proday-accent)] hover:!text-white"
          >
            Rejoindre la bêta
          </PremiumButton>
          <PremiumButton href={ROUTES.features} variant="outline">
            Voir l&apos;app
          </PremiumButton>
        </motion.div>
      </div>

      {/* Bandeau 7 pôles. pleine largeur, centré, desktop + mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.55 }}
        className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-black/55 backdrop-blur-xl"
        aria-label="Les 7 pôles ProDay"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-7 gap-0 px-1 sm:px-4">
          {HERO_SLIDES.map((slide) => (
            <Link
              key={slide.num}
              href={slide.href}
              className="group flex flex-col items-center gap-1.5 px-1 py-4 text-center transition hover:bg-white/[0.04] sm:py-5"
            >
              <span
                className="font-display text-base font-extrabold tabular-nums sm:text-xl"
                style={{ color: slide.color }}
              >
                {slide.num}
              </span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 transition group-hover:text-white sm:block md:text-[11px]">
                {slide.label}
              </span>
              <span
                className="mt-1 h-0.5 w-6 rounded-full opacity-80 transition group-hover:w-8"
                style={{ background: slide.color }}
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
