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
  default: "bg-gradient-to-br from-[#000C30] via-black to-black text-white",
  joueur: "bg-gradient-to-br from-[#001854] via-black to-black text-white",
  woman: "bg-gradient-to-br from-[#540000] via-black to-black text-white",
  amateur: "bg-gradient-to-br from-[#841800] via-black to-black text-white",
  supporter: "bg-gradient-to-br from-[#180078] via-black to-black text-white",
  pro: "bg-gradient-to-br from-[#002478] via-black to-black text-white",
  pro_club: "bg-gradient-to-br from-[#002478] via-black to-black text-white",
  pro_staff: "bg-gradient-to-br from-[#001848] via-black to-black text-white",
  sante: "bg-gradient-to-br from-[#006C60] via-black to-black text-white",
  sponsor: "bg-gradient-to-br from-[#0c0a06] via-[#1a1508] to-black text-white",
};

const ACCENT_OVERLAYS: Record<PageAccent, string> = {
  default: "bg-gradient-to-r from-[#000C30]/95 via-black/65 to-black/25",
  joueur: "bg-gradient-to-r from-[#001854]/92 via-black/60 to-black/20",
  woman: "bg-gradient-to-r from-[#540000]/92 via-black/60 to-black/20",
  amateur: "bg-gradient-to-r from-[#841800]/92 via-black/60 to-black/20",
  supporter: "bg-gradient-to-r from-[#180078]/92 via-black/60 to-black/20",
  pro: "bg-gradient-to-r from-[#002478]/92 via-black/60 to-black/20",
  pro_club: "bg-gradient-to-r from-[#002478]/92 via-black/60 to-black/20",
  pro_staff: "bg-gradient-to-r from-[#001848]/92 via-black/60 to-black/20",
  sante: "bg-gradient-to-r from-[#006C60]/92 via-black/60 to-black/20",
  sponsor: "bg-gradient-to-r from-[#0c0a06]/95 via-black/70 to-black/30",
};

const ACCENT_KICKER: Record<PageAccent, string> = {
  default: "text-[var(--proday-accent)]",
  joueur: "text-[#4C8BFF]",
  woman: "text-[#F00000]",
  amateur: "text-[#F03000]",
  supporter: "text-[#3C00F0]",
  pro: "text-[#006CFC]",
  pro_club: "text-[#006CFC]",
  pro_staff: "text-[#3B5BFF]",
  sante: "text-[#00CCB4]",
  sponsor: "text-[#D4AF37]",
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
      className={`relative overflow-hidden noise pt-20 sm:pt-24 ${headerBg} ${hasHeroImage ? "min-h-[300px] sm:min-h-[440px] lg:min-h-[540px]" : ""}`}
    >
      {image && (
        <div className="absolute inset-0">
          <Image
            src={image}
            alt=""
            fill
            className="object-cover object-center scale-[1.02]"
            priority
            sizes="100vw"
          />
          <div className={`absolute inset-0 ${overlayGradient}`} />
          <div className="absolute inset-0 hero-overlay-mobile md:hidden" />
          <div className="absolute inset-0 hero-overlay" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_15%_35%,rgba(34,211,238,0.08),transparent)]" />
        </div>
      )}
      {!image && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_0%,rgba(34,211,238,0.06),transparent)]" />
      )}

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-6 text-center sm:px-6 sm:pb-24 sm:pt-8 md:text-left">
        <Link
          href={backHref}
          className={`mb-8 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] transition md:mx-0 ${backClass}`}
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
            className={`text-xs font-bold uppercase tracking-[0.32em] ${kickerClass}`}
          >
            {kicker}
          </p>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.55 }}
          className={`mx-auto mt-3 max-w-3xl font-display text-[clamp(1.85rem,5.2vw,3.85rem)] font-bold uppercase leading-[1.02] tracking-[-0.03em] sm:text-5xl md:mx-0 lg:text-6xl ${
            hasHeroImage ? "text-[var(--proday-accent)] text-accent-glow" : "text-white"
          }`}
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className={`mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg md:mx-0 ${descClass}`}
        >
          {description}
        </motion.p>
      </div>
    </header>
  );
}
