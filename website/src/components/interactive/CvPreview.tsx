"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Download, Share2 } from "lucide-react";

const STATS = [
  { label: "Matchs", value: "24" },
  { label: "Buts", value: "12" },
  { label: "Passes", value: "8" },
  { label: "Minutes", value: "1860" },
];

export function CvPreview() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 lg:flex-row">
      <motion.div
        initial={{ opacity: 0, rotate: -2 }}
        animate={{ opacity: 1, rotate: 0 }}
        className="relative flex-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
      >
        <div className="border-b border-neutral-100 bg-neutral-900 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-neutral-700">
              <Image
                src="/showcase/classic-profile.jpg"
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs text-neutral-400">CV FOOT PRODAY</p>
              <h3 className="text-xl font-bold">Alex Martin</h3>
              <p className="text-sm text-neutral-300">
                Milieu offensif · Régional · Paris
              </p>
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
            Joueur polyvalent, vision de jeu et volume physique. Alimenté par
            Live Stats ProDay — chaque match met à jour ce document.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">
              Pulse 78
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">
              Profil vérifié
            </span>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col justify-center gap-4 lg:w-64">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-full bg-proday-ink py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          <Download size={18} />
          Exporter PDF
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-full border border-neutral-300 py-3.5 text-sm font-semibold transition hover:bg-neutral-50"
        >
          <Share2 size={18} />
          Partager le lien
        </button>
        <p className="text-xs text-proday-muted">
          Aperçu démo — l&apos;export réel est disponible depuis l&apos;app mobile.
        </p>
      </div>
    </div>
  );
}
