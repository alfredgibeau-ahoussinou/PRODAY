"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const ROLES = [
  {
    id: "player",
    label: "Joueur",
    emoji: "⚽",
    tiles: [
      { title: "Prochain match", value: "Sam 15h", hint: "RSVP ouvert" },
      { title: "Pulse", value: "72", hint: "+4 cette semaine" },
      { title: "Mercato", value: "3", hint: "annonces près de toi" },
      { title: "Covoit", value: "1 place", hint: "aller stadium" },
    ],
    href: ROUTES.joueur,
  },
  {
    id: "coach",
    label: "Coach",
    emoji: "📋",
    tiles: [
      { title: "Effectif", value: "22", hint: "18 dispo" },
      { title: "Convocs", value: "1", hint: "à valider" },
      { title: "Forme", value: "Bonne", hint: "charge OK" },
      { title: "Staff", value: "4", hint: "messages" },
    ],
    href: ROUTES.proStaff,
  },
  {
    id: "club",
    label: "Club",
    emoji: "🏟️",
    tiles: [
      { title: "Équipes", value: "6", hint: "U15 → Seniors" },
      { title: "Matchs", value: "3", hint: "ce weekend" },
      { title: "Licences", value: "148", hint: "à jour" },
      { title: "Shop", value: "12", hint: "commandes" },
    ],
    href: ROUTES.proClub,
  },
  {
    id: "supporter",
    label: "Supporter",
    emoji: "📣",
    tiles: [
      { title: "Club suivi", value: "ProDay FC", hint: "fil actif" },
      { title: "Live", value: "2–1", hint: "67'" },
      { title: "Events", value: "1", hint: "fan day" },
      { title: "Reels", value: "8", hint: "nouveaux" },
    ],
    href: ROUTES.supporter,
  },
] as const;

export function AliveRoleDashboard() {
  const [role, setRole] = useState<(typeof ROLES)[number]["id"]>("player");
  const current = ROLES.find((r) => r.id === role) ?? ROLES[0];

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#052424]/10 bg-white shadow-[0_18px_40px_-28px_rgba(15,31,23,0.28)]">
      <div className="flex flex-wrap gap-2 border-b border-[#052424]/8 px-4 py-3 sm:px-5">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            className={clsx(
              "rounded-xl px-3 py-2 text-sm font-bold transition",
              role === r.id
                ? "bg-accent-gradient text-white"
                : "bg-[#f3f2ec] text-[#052424]/70 hover:text-[#052424]",
            )}
          >
            <span className="mr-1" aria-hidden>
              {r.emoji}
            </span>
            {r.label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-sm text-[rgba(5,36,36,0.62)]">
              Mini-dashboard {current.label.toLowerCase()}. Tape les tuiles, c&apos;est l&apos;esprit de l&apos;app.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {current.tiles.map((t) => (
                <motion.button
                  key={t.title}
                  type="button"
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-2xl border border-[#052424]/8 bg-[#f3f2ec] p-4 text-left transition hover:border-[#0054F0]/40 hover:bg-white"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[rgba(5,36,36,0.62)]">
                    {t.title}
                  </p>
                  <p className="mt-1 font-display text-xl font-extrabold text-[#052424]">{t.value}</p>
                  <p className="mt-1 text-xs text-[#4C8BFF]">{t.hint}</p>
                </motion.button>
              ))}
            </div>
            <Link
              href={current.href}
              className="mt-5 inline-flex text-sm font-bold text-[#4C8BFF] hover:underline"
            >
              Voir le pôle {current.label} →
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
