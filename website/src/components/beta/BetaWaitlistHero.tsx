"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { HeroVideoBackground } from "@/components/HeroVideoBackground";
import { ROUTES } from "@/lib/routes";

type Props = {
  video: string;
  poster: string;
};

export function BetaWaitlistHero({ video, poster }: Props) {
  const reduce = useReducedMotion();

  return (
    <header className="relative flex min-h-[54vh] flex-col justify-end overflow-hidden bg-black pt-24 text-white sm:min-h-[60vh] sm:pt-28 lg:min-h-[64vh]">
      <div className="absolute inset-0">
        <HeroVideoBackground sources={[video]} poster={poster} opacity={0.9} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.5)_100%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 sm:pb-14 lg:pb-16">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="font-display text-[clamp(2.4rem,8vw,4.5rem)] font-medium leading-none tracking-[-0.04em] text-white"
        >
          ProDay
        </motion.p>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: reduce ? 0 : 0.06 }}
          className="mt-3 max-w-xl font-display text-[clamp(1.65rem,4.5vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.03em] text-white/95"
        >
          Rejoins la bêta.
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: reduce ? 0 : 0.12 }}
          className="mt-4 max-w-md text-sm leading-relaxed text-white/60 sm:text-[15px]"
        >
          Installe l’application directement. Gratuit pour la phase bêta.
        </motion.p>

        

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: reduce ? 0 : 0.18 }}
          className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <a
            href="#inscription"
            className="inline-flex min-h-12 items-center justify-center bg-[var(--proday-accent)] px-7 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:brightness-110 active:scale-[0.98]"
          >
            Télécharger l’app
          </a>
          <Link
            href={ROUTES.demo}
            className="inline-flex min-h-12 items-center justify-center border border-white/20 px-6 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:border-white/40 hover:text-white"
          >
            Essayer la démo
          </Link>
        </motion.div>
      </div>
    </header>
  );
}
