"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { HeroVideoBackground } from "@/components/HeroVideoBackground";
import { poleHubForPath, POLE_HUB_LABELS, type PageAccent } from "@/lib/siteArchitecture";
import { ROUTES } from "@/lib/routes";
import { Breadcrumb } from "./Breadcrumb";

type PageHeaderProps = {
  kicker: string;
  title: string;
  description: string;
  image?: string;
  /** Optional looping hero video. Uses `image` as poster when present. */
  video?: string;
  logo?: string;
  logoAlt?: string;
  dark?: boolean;
  accent?: PageAccent;
  pathname?: string;
};

export function PageHeader({
  kicker,
  title,
  description,
  image,
  video,
  logo,
  logoAlt,
  dark: _dark,
  accent: _accent,
  pathname,
}: PageHeaderProps) {
  void _dark;
  void _accent;
  const poleHub = pathname ? poleHubForPath(pathname) : null;
  const backHref = poleHub && pathname !== poleHub ? poleHub : ROUTES.home;
  const backLabel =
    poleHub && pathname !== poleHub
      ? (POLE_HUB_LABELS[backHref] ?? "Retour")
      : "Accueil";

  return (
    <header className="relative min-h-[70vh] overflow-hidden bg-black pt-28 text-white sm:min-h-[78vh] sm:pt-32">
      {video && image ? (
        <div className="absolute inset-0">
          <HeroVideoBackground
            sources={[video]}
            poster={image}
            opacity={0.92}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.55)_100%)]" />
        </div>
      ) : image ? (
        <div className="absolute inset-0">
          <Image
            src={image}
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.55)_100%)]" />
        </div>
      ) : null}

      <div className="relative mx-auto flex min-h-[inherit] max-w-7xl flex-col justify-end gap-10 px-4 pb-16 pt-4 sm:px-6 sm:pb-20 lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <Breadcrumb />
          <Link
            href={backHref}
            className="mb-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 transition hover:text-[var(--pole-accent,#4C8BFF)]"
          >
            <ArrowLeft size={12} />
            {backLabel}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-4"
          >
            {logo ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/15 bg-black/40 p-1.5 backdrop-blur-sm sm:h-12 sm:w-12">
                <Image
                  src={logo}
                  alt={logoAlt ?? ""}
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : null}
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--pole-accent,#4C8BFF)]">
              {kicker}
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="mt-5 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.5rem)] font-medium leading-[1.0] tracking-[-0.04em] text-white"
          >
            {title}
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="max-w-md border-t border-white/15 pt-6 text-base leading-relaxed text-white/70 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"
        >
          {description}
        </motion.p>
      </div>
    </header>
  );
}
