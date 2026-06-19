"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { poleHubForPath } from "@/lib/siteArchitecture";
import { ROUTES } from "@/lib/routes";
import type { PageAccent } from "@/lib/siteArchitecture";

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
  default: "bg-gradient-to-br from-neutral-950 via-[#0a0a0c] to-neutral-950 text-white",
  joueur: "bg-gradient-to-br from-emerald-950 via-neutral-950 to-emerald-950/80 text-white",
  woman: "bg-gradient-to-br from-pink-950 via-rose-900 to-neutral-900 text-white",
  pro: "bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 text-white",
  sante: "bg-gradient-to-br from-teal-950 via-teal-900 to-neutral-900 text-white",
  sponsor: "bg-gradient-to-br from-slate-950 via-amber-950/40 to-slate-950 text-white",
};

const ACCENT_OVERLAYS: Record<PageAccent, string> = {
  default: "bg-gradient-to-r from-neutral-950/88 via-neutral-950/40 to-neutral-950/5",
  joueur: "bg-gradient-to-r from-emerald-950/88 via-emerald-950/40 to-emerald-950/5",
  woman: "bg-gradient-to-r from-pink-950/88 via-pink-950/45 to-pink-950/5",
  pro: "bg-gradient-to-r from-blue-950/88 via-blue-950/45 to-blue-950/5",
  sante: "bg-gradient-to-r from-teal-950/88 via-teal-950/45 to-teal-950/5",
  sponsor: "bg-gradient-to-r from-slate-950/90 via-amber-950/35 to-slate-950/5",
};

const ACCENT_KICKER: Record<PageAccent, string> = {
  default: "text-neutral-400",
  joueur: "text-emerald-300",
  woman: "text-pink-300",
  pro: "text-blue-300",
  sante: "text-teal-300",
  sponsor: "text-amber-300",
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

  const headerBg = hasHeroImage
    ? "bg-neutral-950 text-white"
    : ACCENT_GRADIENTS[accent];

  const overlayGradient = ACCENT_OVERLAYS[accent];
  const kickerClass = isDarkHero ? ACCENT_KICKER[accent] : "text-proday-muted";
  const descClass = isDarkHero ? "text-white/85" : "text-proday-muted";
  const backClass = isDarkHero ? "text-white/70 hover:text-white" : "text-proday-muted";

  const poleHub = pathname ? poleHubForPath(pathname) : null;
  const backHref = poleHub && pathname !== poleHub ? poleHub : ROUTES.home;
  const backLabel =
    poleHub && pathname !== poleHub
      ? backHref === ROUTES.joueurs
        ? "Pôle Joueur"
        : backHref === ROUTES.pro
          ? "Pôle Pro"
          : backHref === ROUTES.sante
            ? "Pôle Santé"
            : backHref === ROUTES.partenaires
              ? "Pôle Partenaires"
              : "Retour"
      : "Accueil";

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
          href={backHref}
          className={`mb-8 inline-flex items-center gap-2 text-sm transition ${backClass}`}
        >
          <ArrowLeft size={16} />
          {backLabel}
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
          className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
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
