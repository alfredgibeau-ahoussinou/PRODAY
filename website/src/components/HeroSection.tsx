"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ROUTES } from "@/lib/routes";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/football-stadium-night-01.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:pb-24">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#4C8BFF]"
        >
          ProDay · Terrain
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6 }}
          className="mt-5 max-w-4xl font-display text-[clamp(2.4rem,7vw,4.75rem)] font-medium leading-[0.98] tracking-[-0.04em] text-white"
        >
          Le foot dans une app simple.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-5 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg"
        >
          Tu crées ton profil, tu rejoins ton équipe, tu joues. Matchs, messages et saison au même
          endroit.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <PremiumButton href="#parcours">Commencer en 30 sec</PremiumButton>
          <PremiumButton href={ROUTES.demo} variant="ghost">
            Voir une démo
          </PremiumButton>
          <PremiumButton href={ROUTES.betaWaitlist} variant="outline">
            Rejoindre la bêta
          </PremiumButton>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-14 font-mono text-[10px] uppercase tracking-[0.28em] text-white/40"
        >
          Scroll to explore
        </motion.p>
      </div>
    </section>
  );
}
