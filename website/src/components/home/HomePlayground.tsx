"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

const TABS = [
  {
    id: "match",
    label: "Matchs",
    emoji: "⚽",
    image: "/images/football-match-01.jpg",
    caption: "Convocations + RSVP. Tout le monde répond au même endroit.",
  },
  {
    id: "mercato",
    label: "Mercato",
    emoji: "🔥",
    image: "/images/football-mercato-01.jpg",
    caption: "Annonces, candidatures, profil. Te faire remarquer près de chez toi.",
  },
  {
    id: "team",
    label: "Équipe",
    emoji: "🤝",
    image: "/images/football-team-01.jpg",
    caption: "Covoit, fil, messages. Fini les 5 groupes WhatsApp.",
  },
  {
    id: "live",
    label: "Direct",
    emoji: "📱",
    image: "/showcase/classic-exp-pulse.jpg",
    caption: "Stats qui nourrissent ton profil. Visibilité en vrai.",
  },
] as const;

/** Playground interactif : tape un onglet, l’écran change. */
export function HomePlayground() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("match");
  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <section className="scroll-mt-28 bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00A8C4]">Touche</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.03em] text-[#0f1f17] sm:text-4xl">
            Explore l&apos;app
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#4a6356]">
            Clique un truc. Regarde ce que ça ouvre. C&apos;est interactif pour de vrai.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {TABS.map((tab) => {
            const on = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={clsx(
                  "chip-pop rounded-2xl border px-4 py-2.5 text-sm font-bold transition",
                  on
                    ? "border-transparent bg-[#00A8C4] text-white shadow-[0_10px_30px_-12px_rgba(0,168,196,0.55)]"
                    : "border-[#0f1f17]/12 bg-[#eef6f1] text-[#0f1f17]/75 hover:border-[#00A8C4]/40 hover:text-[#0f1f17]",
                )}
              >
                <span className="mr-1.5" aria-hidden>
                  {tab.emoji}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative mx-auto w-full max-w-md">
            <div className="animate-float absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#00A8C4]/20 via-transparent to-[#FF5A1F]/15 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-[#0f1f17]/10 bg-[#0f1f17] shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F87171]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#34D399]" />
                <span className="ml-3 text-xs font-semibold text-white/40">ProDay · {current.label}</span>
              </div>
              <div className="relative aspect-[4/5] sm:aspect-[5/6]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, scale: 1.04, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -8 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={current.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 420px"
                      priority={current.id === "match"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <p className="absolute bottom-0 left-0 right-0 p-5 text-sm font-medium leading-relaxed text-white">
                      {current.caption}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {TABS.map((tab, i) => {
              const on = tab.id === active;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActive(tab.id)}
                  className={clsx(
                    "w-full rounded-2xl border p-4 text-left transition",
                    on
                      ? "border-[#00A8C4]/40 bg-[#00A8C4]/10"
                      : "border-[#0f1f17]/10 bg-[#eef6f1] hover:border-[#0f1f17]/20",
                  )}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[#4a6356]">
                    0{i + 1}
                  </p>
                  <p className="mt-1 font-display text-lg font-extrabold text-[#0f1f17]">
                    {tab.emoji} {tab.label}
                  </p>
                  <p className="mt-1 text-sm text-[#4a6356]">{tab.caption}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
