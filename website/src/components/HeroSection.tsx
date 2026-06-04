"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { BRAND } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export function HeroSection() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 20 });
  const sy = useSpring(my, { stiffness: 80, damping: 20 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-8, 8]);

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
    <section className="relative min-h-screen overflow-hidden pt-24 gradient-mesh noise">
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-neutral-200/60 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-24 bottom-32 h-80 w-80 rounded-full bg-neutral-300/40 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, -25, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pt-16">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium tracking-widest text-proday-muted"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-proday-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-proday-success" />
            </span>
            {BRAND.tagline}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Une saison.
            <br />
            <span className="bg-gradient-to-r from-neutral-900 via-neutral-600 to-neutral-900 bg-clip-text text-transparent">
              Une app.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-6 max-w-lg text-lg text-proday-muted"
          >
            {BRAND.mission}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Link
              href={ROUTES.beta}
              className="group inline-flex items-center gap-2 rounded-full bg-proday-ink px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-neutral-900/20 transition hover:scale-[1.02] hover:bg-neutral-800"
            >
              Commencer gratuitement
              <ArrowRight
                size={16}
                className="transition group-hover:translate-x-1"
              />
            </Link>
            <Link
              href={ROUTES.demo}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-7 py-3.5 text-sm font-semibold transition hover:border-neutral-400"
            >
              <Play size={16} fill="currentColor" />
              Voir la démo
            </Link>
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
            className="relative w-full max-w-sm animate-float"
          >
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-neutral-200 to-neutral-100 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-900 shadow-2xl shadow-neutral-900/30">
              <Image
                src="/showcase/classic-discover-hero.jpg"
                alt="Aperçu ProDay"
                width={400}
                height={700}
                className="h-auto w-full object-cover opacity-90"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                <Image
                  src="/branding/logo-dark.png"
                  alt=""
                  width={120}
                  height={40}
                  className="mb-2 h-8 w-auto object-contain"
                />
                <p className="text-sm text-white/80">
                  Mercato · Matchs · Arena · Pulse
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
