"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { BRAND } from "@/lib/content";
import { ROUTES } from "@/lib/routes";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { Kicker } from "@/components/ui/Kicker";

export function HeroSection() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 20 });
  const sy = useSpring(my, { stiffness: 80, damping: 20 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-6, 6]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <section className="relative min-h-screen overflow-hidden pt-24 gradient-mesh noise grid-lines">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-14 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pt-20">
        <div>
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
            className="font-display mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            Une saison.
            <br />
            <span className="text-shimmer">Une app.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-white/60"
          >
            {BRAND.mission}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <PremiumButton href={ROUTES.beta}>Accès anticipé</PremiumButton>
            <PremiumButton href={ROUTES.joueurs} variant="outline">
              Pôle Joueur
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
            className="mt-10 flex flex-wrap gap-2"
          >
            {["Profil & carrière", "Mercato", "Journal activités", "Arena", "Partenaires"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="perspective-[1200px] flex justify-center lg:justify-end"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative w-full max-w-[320px] animate-float"
          >
            <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-blue-500/20 via-violet-500/10 to-transparent blur-2xl" />
            <div className="card-premium relative overflow-hidden rounded-[2.25rem]">
              <div className="absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-black/40 to-transparent" />
              <Image
                src="/showcase/classic-discover-hero.jpg"
                alt="Aperçu ProDay"
                width={400}
                height={720}
                className="h-auto w-full object-cover"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pt-24">
                <p className="mb-3 text-xs tracking-widest text-emerald-400/80 uppercase">
                  Journal & Mercato
                </p>
                <Image
                  src="/branding/logo-dark.png"
                  alt=""
                  width={110}
                  height={36}
                  className="mb-2 h-7 w-auto object-contain"
                />
                <p className="text-sm text-white/70">
                  Analyse IA sur vos highlights — pas sur chaque geste
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 sm:block">
        <Link
          href="#decouvrir"
          className="flex flex-col items-center gap-2 text-xs tracking-widest text-white/30 transition hover:text-white/60"
        >
          Découvrir
          <ArrowRight size={14} className="rotate-90" />
        </Link>
      </div>
    </section>
  );
}
