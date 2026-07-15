"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { heroImageForDemoPole, type DemoPoleId } from "@/lib/demoPoles";

type DemoHeroProps = {
  pole: DemoPoleId;
};

export function DemoHero({ pole }: DemoHeroProps) {
  const image = heroImageForDemoPole(pole);

  return (
    <section className="relative min-h-[100dvh] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={image}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.45)_70%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[100dvh] max-w-4xl flex-col items-center justify-center px-4 pb-28 pt-24 text-center sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-[clamp(2.75rem,10vw,5.5rem)] font-bold uppercase leading-none tracking-tight text-white"
        >
          Pro<span className="text-[var(--proday-accent)]">Day</span>
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55 }}
          className="mt-6 max-w-xl font-display text-[clamp(1.35rem,4vw,2.25rem)] font-bold leading-tight text-white"
        >
          Naviguez comme dans l&apos;app
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5 }}
          className="mt-4 max-w-md text-base leading-relaxed text-white/65 sm:text-lg"
        >
          Choisissez un pôle, parcourez les onglets — navigation illustrative, sans compte
          connecté.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#demo-app"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--proday-accent)] px-7 py-3 text-sm font-bold text-black transition hover:brightness-110"
          >
            Essayer la démo
            <ArrowDown size={16} aria-hidden />
          </a>
          <Link
            href={ROUTES.betaWaitlist}
            className="inline-flex min-h-12 items-center rounded-full border border-white/25 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
          >
            Accès anticipé
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
