"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { poleHubForPath, POLE_HUB_LABELS, type PageAccent } from "@/lib/siteArchitecture";
import { ROUTES } from "@/lib/routes";

type PageHeaderProps = {
  kicker: string;
  title: string;
  description: string;
  image?: string;
  logo?: string;
  logoAlt?: string;
  dark?: boolean;
  accent?: PageAccent;
  pathname?: string;
};

const ACCENT_GRADIENTS: Record<PageAccent, string> = {
  default: "bg-black text-white",
  joueur: "bg-gradient-to-br from-emerald-950 via-black to-black text-white",
  woman: "bg-gradient-to-br from-pink-950 via-black to-black text-white",
  amateur: "bg-gradient-to-br from-orange-950 via-black to-black text-white",
  supporter: "bg-gradient-to-br from-violet-950 via-black to-black text-white",
  pro: "bg-gradient-to-br from-blue-950 via-black to-black text-white",
  pro_club: "bg-gradient-to-br from-blue-950 via-black to-black text-white",
  pro_staff: "bg-gradient-to-br from-indigo-950 via-black to-black text-white",
  sante: "bg-gradient-to-br from-teal-950 via-black to-black text-white",
  sponsor: "bg-gradient-to-br from-slate-950 via-black to-black text-white",
};

const ACCENT_OVERLAYS: Record<PageAccent, string> = {
  default: "hero-overlay-side",
  joueur: "bg-gradient-to-r from-emerald-950/90 via-black/60 to-black/20",
  woman: "bg-gradient-to-r from-pink-950/90 via-black/60 to-black/20",
  amateur: "bg-gradient-to-r from-orange-950/90 via-black/60 to-black/20",
  supporter: "bg-gradient-to-r from-violet-950/90 via-black/60 to-black/20",
  pro: "bg-gradient-to-r from-blue-950/90 via-black/60 to-black/20",
  pro_club: "bg-gradient-to-r from-blue-950/90 via-black/60 to-black/20",
  pro_staff: "bg-gradient-to-r from-indigo-950/90 via-black/60 to-black/20",
  sante: "bg-gradient-to-r from-teal-950/90 via-black/60 to-black/20",
  sponsor: "bg-gradient-to-r from-slate-950/90 via-black/60 to-black/20",
};

const ACCENT_KICKER: Record<PageAccent, string> = {
  default: "text-[var(--proday-accent)]",
  joueur: "text-emerald-400",
  woman: "text-pink-400",
  amateur: "text-orange-400",
  supporter: "text-violet-400",
  pro: "text-blue-400",
  pro_club: "text-blue-400",
  pro_staff: "text-indigo-400",
  sante: "text-teal-400",
  sponsor: "text-amber-400",
};

export function PageHeader({
  kicker,
  title,
  description,
  image,
  logo,
  logoAlt,
  dark = true,
  accent = "default",
  pathname,
}: PageHeaderProps) {
  const hasHeroImage = Boolean(image);
  const isDarkHero = dark || hasHeroImage;

  const headerBg = hasHeroImage ? "bg-black text-white" : ACCENT_GRADIENTS[accent];

  const overlayGradient = ACCENT_OVERLAYS[accent];
  const kickerClass = isDarkHero ? ACCENT_KICKER[accent] : "text-proday-muted";
  const descClass = isDarkHero ? "text-white/75" : "text-proday-muted";
  const backClass = isDarkHero
    ? "text-white/60 hover:text-[var(--proday-accent)]"
    : "text-proday-muted";

  const poleHub = pathname ? poleHubForPath(pathname) : null;
  const backHref = poleHub && pathname !== poleHub ? poleHub : ROUTES.home;
  const backLabel =
    poleHub && pathname !== poleHub
      ? (POLE_HUB_LABELS[backHref] ?? "Retour")
      : "Accueil";

  return (
    <header
      className={`relative overflow-hidden pt-20 sm:pt-24 ${headerBg} ${hasHeroImage ? "min-h-[280px] sm:min-h-[420px] lg:min-h-[520px]" : ""}`}
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
          <div className="absolute inset-0 hero-overlay-mobile md:hidden" />
          <div className="absolute inset-0 hero-overlay" />
        </div>
      )}

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-6 text-center sm:px-6 sm:pb-20 sm:pt-8 md:text-left">
        <Link
          href={backHref}
          className={`mb-8 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wide transition md:mx-0 ${backClass}`}
        >
          <ArrowLeft size={16} />
          {backLabel}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-center gap-4 md:justify-start"
        >
          {logo && (
            <div
              className={`relative h-14 shrink-0 overflow-hidden rounded-xl shadow-lg sm:h-16 sm:rounded-2xl ${
                logo.includes("logo-proday-official")
                  ? "w-[60px] bg-white p-1 ring-1 ring-white/20 sm:w-[68px] sm:p-1.5"
                  : "w-14 bg-black/70 p-1 ring-1 ring-white/15 sm:w-16 sm:p-1.5"
              }`}
            >
              <Image
                src={logo}
                alt={logoAlt ?? ""}
                width={64}
                height={64}
                className="h-full w-full object-contain object-top"
                style={{ width: "auto", height: "auto" }}
              />
            </div>
          )}
          <p
            className={`text-xs font-bold uppercase tracking-[0.28em] ${kickerClass}`}
          >
            {kicker}
          </p>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`mx-auto mt-3 max-w-3xl font-display text-[clamp(1.75rem,5vw,3.75rem)] font-bold uppercase leading-tight tracking-tight sm:text-5xl md:mx-0 lg:text-6xl ${
            hasHeroImage ? "text-[var(--proday-accent)] text-accent-glow" : "text-white"
          }`}
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mx-auto mt-5 max-w-2xl text-lg md:mx-0 ${descClass}`}
        >
          {description}
        </motion.p>
      </div>
    </header>
  );
}
