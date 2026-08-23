"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";

const FEED = [
  {
    id: "1",
    emoji: "📣",
    title: "Convocation envoyée",
    body: "U19 · Match samedi 15h · 14/18 ont répondu",
    tag: "Matchs",
  },
  {
    id: "2",
    emoji: "⚽",
    title: "But validé",
    body: "Amine · 2 à 1 à la 54' · stats profil mises à jour",
    tag: "Direct",
  },
  {
    id: "3",
    emoji: "🚗",
    title: "Place covoit",
    body: "Léa propose 2 places pour le déplacement",
    tag: "Équipe",
  },
  {
    id: "4",
    emoji: "🔥",
    title: "Annonce Mercato",
    body: "Club cherche milieu offensif · Île de France",
    tag: "Mercato",
  },
  {
    id: "5",
    emoji: "🩺",
    title: "RDV santé",
    body: "Kiné dispo demain près du stade",
    tag: "Santé",
  },
] as const;

const FILTERS = ["Tous", "Matchs", "Direct", "Équipe", "Mercato", "Santé"] as const;

export function AliveActivityFeed() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tous");
  const items = FEED.filter((f) => filter === "Tous" || f.tag === filter);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#052424]/10 bg-white shadow-[0_18px_40px_-28px_rgba(15,31,23,0.28)]">
      <div className="flex flex-wrap gap-2 border-b border-[#052424]/8 px-4 py-3 sm:px-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={clsx(
              "rounded-xl px-3 py-1.5 text-xs font-bold transition",
              filter === f
                ? "bg-[#052424] text-white"
                : "bg-[#f3f2ec] text-[rgba(5,36,36,0.62)] hover:text-[#052424]",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-[#052424]/6">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="flex gap-3 px-4 py-3.5 sm:px-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f3f2ec] text-lg">
                {item.emoji}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#052424]">{item.title}</p>
                  <span className="rounded-md bg-[#1E3AFF]/12 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#052424]">
                    {item.tag}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-[rgba(5,36,36,0.62)]">{item.body}</p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
