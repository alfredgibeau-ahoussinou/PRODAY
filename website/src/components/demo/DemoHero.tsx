"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { HeroVideoBackground } from "@/components/HeroVideoBackground";
import { getRoleVisuals, type RoleVisualId } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";
import type { DemoPoleId } from "@/lib/demoPoles";

type DemoHeroProps = {
  pole: DemoPoleId;
};

function visualIdForPole(pole: DemoPoleId): RoleVisualId {
  if (pole === "coach") return "coach";
  if (pole === "sponsor") return "sponsor";
  if (pole === "sante") return "sante";
  return pole;
}

const ease = [0.22, 1, 0.36, 1] as const;

export function DemoHero({ pole }: DemoHeroProps) {
  const visuals = getRoleVisuals(visualIdForPole(pole));
  const pack = getRoleVisuals("demo");
  const poster = visuals.hero || pack.hero;
  const video = pack.heroVideo;
  const reduce = useReducedMotion();

  return (
    <header className="relative isolate min-h-[100svh] overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <HeroVideoBackground sources={[video ?? "/videos/pole-joueur.mp4"]} poster={poster} opacity={0.92} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(76,139,255,0.28),transparent_55%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-24">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          className="font-display text-[clamp(1.6rem,4vw,2.4rem)] font-semibold tracking-[-0.03em] text-white"
        >
          Pro Day Démo
        </motion.p>
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.06, ease }}
          className="mt-3 max-w-3xl font-display text-[clamp(2.8rem,9vw,5.6rem)] font-medium leading-[0.92] tracking-[-0.045em]"
        >
          Teste l’app avant de t’inscrire.
        </motion.h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.14, ease }}
          className="mt-6 max-w-md text-base leading-relaxed text-white/70 sm:text-lg"
        >
          Cinq pôles. Navigation réelle. Zéro compte. Choisis Joueur, Club, Coach, Supporter ou
          Sponsor : puis entre dans le téléphone.
        </motion.p>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22, ease }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <a
            href="#demo-app"
            className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Essayer
            <ArrowDown size={16} />
          </a>
          <Link
            href={ROUTES.betaWaitlist}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white/85 transition hover:border-white/50 hover:bg-white/5"
          >
            Liste d’attente
          </Link>
        </motion.div>
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10 font-mono text-[10px] uppercase tracking-[0.26em] text-white/40"
        >
          Scroll pour ouvrir la démo
        </motion.p>
      </div>
    </header>
  );
}
