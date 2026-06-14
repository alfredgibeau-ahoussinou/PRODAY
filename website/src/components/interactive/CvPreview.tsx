"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Download, Share2 } from "lucide-react";
import { UNIVERSE_THEME } from "@/components/universe/universeTheme";
import type { ProductLineWeb } from "@/lib/content";

const STATS = [
  { label: "Matchs", value: "24" },
  { label: "Buts", value: "12" },
  { label: "Passes", value: "8" },
  { label: "Minutes", value: "1860" },
];

const CV_COPY: Record<
  ProductLineWeb,
  {
    headerLabel: string;
    name: string;
    role: string;
    footer: string;
    image: string;
  }
> = {
  homme: {
    headerLabel: "CV FOOT PRODAY",
    name: "Alex Martin",
    role: "Milieu offensif · Régional · Paris",
    footer:
      "Profil polyvalent, vision de jeu et volume physique. Alimenté par Live Stats ProDay — chaque match met à jour ce document.",
    image: "/showcase/classic-profile.jpg",
  },
  woman: {
    headerLabel: "CV FOOT PRODAY WOMAN",
    name: "Léa Dupont",
    role: "Milieu · Régional F · Lyon",
    footer:
      "Profil complet pour le Mercato F — stats saison, galerie et export PDF. Chaque match enrichit votre CV joueuse.",
    image: "/showcase/woman/woman-profile.jpg",
  },
  pro: {
    headerLabel: "CV PRODAY PRO",
    name: "Thomas Bernard",
    role: "Coach · National · Bordeaux",
    footer:
      "Parcours staff et certifications — vitrine pro pour le réseau vérifié ProDay.",
    image: "/showcase/classic-staff.jpg",
  },
  sante: {
    headerLabel: "CABINET PRODAY SANTÉ",
    name: "Dr. Sophie Martin",
    role: "Kinésithérapeute · Sport · Paris",
    footer:
      "Agenda en ligne, messagerie patients et visibilité auprès des clubs partenaires.",
    image: "/showcase/classic-exp-profile.jpg",
  },
};

type CvPreviewProps = {
  universe?: ProductLineWeb;
};

export function CvPreview({ universe = "homme" }: CvPreviewProps) {
  const copy = CV_COPY[universe];
  const theme = UNIVERSE_THEME[universe];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 lg:flex-row">
      <motion.div
        initial={{ opacity: 0, rotate: -2 }}
        animate={{ opacity: 1, rotate: 0 }}
        className="relative flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
      >
        <div
          className="border-b border-neutral-100 p-6 text-white"
          style={{ backgroundColor: theme.pulseStroke }}
        >
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-black/20">
              <Image
                src={copy.image}
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs text-white/70">{copy.headerLabel}</p>
              <h3 className="text-xl font-bold">{copy.name}</h3>
              <p className="text-sm text-white/85">{copy.role}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-proday-muted">
            Saison 2025-26
          </p>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-neutral-50 p-3 text-center"
              >
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-proday-muted">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-proday-muted leading-relaxed">
            {copy.footer}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: theme.pulseStroke }}
            >
              Pulse 78
            </span>
            <span className="text-xs text-proday-muted">Mis à jour après le dernier match</span>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col justify-center gap-4 lg:w-64">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold transition hover:bg-neutral-50"
        >
          <Download size={18} />
          Export PDF
        </button>
        <button
          type="button"
          className={`flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition ${theme.pricingAccent} hover:opacity-90`}
        >
          <Share2 size={18} />
          Partager le lien
        </button>
        <p className="text-sm text-proday-muted">
          {universe === "woman"
            ? "Le CV joueuse se met à jour automatiquement depuis l'app Woman."
            : universe === "pro"
              ? "Le CV pro est synchronisé avec votre profil staff vérifié."
              : "Le CV se met à jour automatiquement depuis l'app après chaque match."}
        </p>
      </div>
    </div>
  );
}
