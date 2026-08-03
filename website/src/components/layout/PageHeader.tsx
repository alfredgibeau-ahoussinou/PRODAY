"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { poleHubForPath, POLE_HUB_LABELS, type PageAccent } from "@/lib/siteArchitecture";
import { ROUTES } from "@/lib/routes";
import { Breadcrumb } from "./Breadcrumb";

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
  evenements: "bg-gradient-to-br from-[#0e4a5c] via-black to-black text-white",
  sante: "bg-gradient-to-br from-[#006C60] via-black to-black text-white",
  sponsor: "bg-gradient-to-br from-[#0c0a06] via-[#1a1508] to-black text-white",
};

const ACCENT_OVERLAYS: Record<PageAccent, string> = {
  default: "bg-gradient-to-r from-[#000C30]/95 via-black/55 to-transparent",
  joueur: "bg-gradient-to-r from-[#001854]/92 via-black/50 to-transparent",
  woman: "bg-gradient-to-r from-[#540000]/92 via-black/50 to-transparent",
  amateur: "bg-gradient-to-r from-[#841800]/92 via-black/50 to-transparent",
  supporter: "bg-gradient-to-r from-[#180078]/92 via-black/50 to-transparent",
  pro: "bg-gradient-to-r from-[#002478]/92 via-black/50 to-transparent",
  pro_club: "bg-gradient-to-r from-[#002478]/92 via-black/50 to-transparent",
  pro_staff: "bg-gradient-to-r from-[#001848]/92 via-black/50 to-transparent",
  evenements: "bg-gradient-to-r from-[#0e4a5c]/92 via-black/50 to-transparent",
  sante: "bg-gradient-to-r from-[#006C60]/92 via-black/50 to-transparent",
  sponsor: "bg-gradient-to-r from-[#0c0a06]/95 via-black/60 to-transparent",
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
  evenements: "text-[#22D3EE]",
  sante: "text-[#00CCB4]",
  sponsor: "text-[#D4AF37]",
};

const ACCENT_RULE: Record<PageAccent, string> = {
  default: "bg-[var(--proday-accent)]",
  joueur: "bg-[#0054F0]",
  woman: "bg-[#F00000]",
  amateur: "bg-[#F03000]",
  supporter: "bg-[#3C00F0]",
  pro: "bg-[#006CFC]",
  pro_club: "bg-[#006CFC]",
  pro_staff: "bg-[#3B5BFF]",
  evenements: "bg-[#0891B2]",
  sante: "bg-[#00CCB4]",
  sponsor: "bg-[#D4AF37]",
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
  const descClass = isDarkHero ? "text-white/70" : "text-proday-muted";
  const backClass = isDarkHero
    ? "text-white/55 hover:text-white"
    : "text-proday-muted";

  const poleHub = pathname ? poleHubForPath(pathname) : null;
  const backHref = poleHub && pathname !== poleHub ? poleHub : ROUTES.home;
  const backLabel =
    poleHub && pathname !== poleHub
      ? (POLE_HUB_LABELS[backHref] ?? "Retour")
      : "Accueil";

  return (
    <header
      className={`relative overflow-hidden pt-28 sm:pt-32 ${headerBg} ${
        hasHeroImage ? "min-h-[340px] sm:min-h-[480px] lg:min-h-[560px]" : "min-h-[280px]"
      }`}
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
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        </div>
      )}

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-4 sm:px-6 sm:pb-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <Breadcrumb />
          
          <Link
            href={backHref}
            className={`mb-8 inline-flex items-center gap-2 border-b border-white/15 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:border-white/40 ${backClass}`}
          >
            <ArrowLeft size={14} />
            {backLabel}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-4"
          >
            {logo && (
              <div
                className={`relative h-14 shrink-0 overflow-hidden rounded-2xl shadow-xl sm:h-16 ${
                  logo.includes("logo-proday-official")
                    ? "w-[60px] bg-white p-1 sm:w-[68px]"
                    : "w-14 bg-black/50 p-1 ring-1 ring-white/20 sm:w-16"
                }`}
              >
                <Image
                  src={logo}
                  alt={logoAlt ?? ""}
                  width={64}
                  height={64}
                  className="h-full w-full object-contain object-top"
                />
              </div>
            )}
            <div>
              <p className={`font-signature text-2xl italic leading-none ${kickerClass}`}>
                {kicker}
              </p>
              <div className={`mt-3 h-1 w-16 rounded-full ${ACCENT_RULE[accent]}`} aria-hidden />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.55 }}
            className="font-display mt-6 max-w-3xl text-[clamp(2.1rem,6vw,4.25rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.04em] text-white"
          >
            {title}
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="border-t border-white/15 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"
        >
          <p className={`max-w-md text-base leading-relaxed sm:text-lg ${descClass}`}>
            {description}
          </p>
        </motion.div>
      </div>
    </header>
  );
}
