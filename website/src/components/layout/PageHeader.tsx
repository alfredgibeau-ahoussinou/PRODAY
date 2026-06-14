"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/lib/routes";

type PageHeaderProps = {
  kicker: string;
  title: string;
  description: string;
  image?: string;
  logo?: string;
  logoAlt?: string;
  dark?: boolean;
  accent?: "default" | "woman" | "pro" | "sante";
};

export function PageHeader({
  kicker,
  title,
  description,
  image,
  logo,
  logoAlt,
  dark = false,
  accent = "default",
}: PageHeaderProps) {
  const isWoman = accent === "woman";
  const isPro = accent === "pro";
  const isSante = accent === "sante";
  const hasHeroImage = Boolean(image);
  const isDarkHero = dark || isWoman || isPro || isSante || hasHeroImage;

  const headerBg = hasHeroImage
    ? "bg-neutral-950 text-white"
    : isWoman
      ? "bg-gradient-to-br from-pink-950 via-rose-900 to-neutral-900 text-white"
      : isPro
        ? "bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 text-white"
        : isSante
          ? "bg-gradient-to-br from-teal-950 via-teal-900 to-neutral-900 text-white"
          : dark
            ? "bg-neutral-900 text-white"
            : "gradient-mesh bg-[var(--proday-bg)]";

  const overlayGradient = isWoman
    ? "bg-gradient-to-r from-pink-950/88 via-pink-950/45 to-pink-950/5"
    : isPro
      ? "bg-gradient-to-r from-blue-950/88 via-blue-950/45 to-blue-950/5"
      : isSante
        ? "bg-gradient-to-r from-teal-950/88 via-teal-950/45 to-teal-950/5"
        : "bg-gradient-to-r from-neutral-950/88 via-neutral-950/40 to-neutral-950/5";

  const kickerClass = isDarkHero
    ? isWoman
      ? "text-pink-300"
      : isPro
        ? "text-blue-300"
        : isSante
          ? "text-teal-300"
          : "text-neutral-400"
    : "text-proday-muted";

  const descClass = isDarkHero ? "text-white/85" : "text-proday-muted";
  const backClass = isDarkHero ? "text-white/70" : "text-proday-muted";

  return (
    <header
      className={`relative overflow-hidden pt-24 ${headerBg} ${hasHeroImage ? "min-h-[420px] sm:min-h-[480px]" : ""}`}
    >
      {image && (
        <div className="absolute inset-0">
          <Image
            src={image}
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className={`absolute inset-0 ${overlayGradient}`} />
        </div>
      )}

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20">
        <Link
          href={ROUTES.home}
          className={`mb-8 inline-flex items-center gap-2 text-sm transition hover:opacity-80 ${backClass}`}
        >
          <ArrowLeft size={16} />
          Accueil
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4"
        >
          {logo && (
            <Image
              src={logo}
              alt={logoAlt ?? ""}
              width={72}
              height={72}
              className="rounded-2xl bg-white/10 shadow-lg ring-1 ring-white/20"
            />
          )}
          <p className={`text-xs font-semibold tracking-[0.2em] ${kickerClass}`}>
            {kicker}
          </p>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mt-5 max-w-2xl text-lg ${descClass}`}
        >
          {description}
        </motion.p>
      </div>
    </header>
  );
}
