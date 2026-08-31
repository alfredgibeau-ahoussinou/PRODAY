"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export type AlivePlayer = {
  name: string;
  role: string;
  club: string;
  image: string;
  rating: number;
  stats: { label: string; value: string }[];
  badges: string[];
};

const DEFAULT_PLAYERS: AlivePlayer[] = [
  {
    name: "Amine K.",
    role: "Milieu",
    club: "ProDay FC",
    image: "/images/card-player-01.jpg",
    rating: 84,
    stats: [
      { label: "Matchs", value: "18" },
      { label: "Buts", value: "6" },
      { label: "Passes", value: "9" },
    ],
    badges: ["Forme", "Leader"],
  },
  {
    name: "Léa M.",
    role: "Attaquante",
    club: "United Amateur",
    image: "/showcase/woman/woman-match.jpg",
    rating: 81,
    stats: [
      { label: "Matchs", value: "14" },
      { label: "Buts", value: "11" },
      { label: "Tirs", value: "42" },
    ],
    badges: ["Sniper", "MVP"],
  },
  {
    name: "Noah R.",
    role: "Défenseur",
    club: "AS Terrain",
    image: "/images/football-mercato-01.jpg",
    rating: 79,
    stats: [
      { label: "Matchs", value: "20" },
      { label: "Tacles", value: "47" },
      { label: "Propres", value: "8" },
    ],
    badges: ["Mur", "Assidu"],
  },
];

function PlayerCard({ player }: { player: AlivePlayer }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      className="group relative h-[280px] w-full text-left [perspective:1000px]"
      aria-label={`${player.name}, ${flipped ? "stats" : "profil"}`}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative h-full w-full [transform-style:preserve-3d]"
      >
        <div className="absolute inset-0 overflow-hidden rounded-3xl border border-[#052424]/10 bg-white shadow-[0_18px_40px_-24px_rgba(15,31,23,0.3)] [backface-visibility:hidden]">
          <div className="relative h-40">
            <Image src={player.image} alt="" fill className="object-cover" sizes="280px" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            <span className="absolute right-3 top-3 rounded-xl bg-[#052424] px-2.5 py-1 text-sm font-extrabold text-white">
              {player.rating}
            </span>
          </div>
          <div className="px-4 pb-4 pt-1">
            <p className="font-display text-lg font-extrabold text-[#052424]">{player.name}</p>
            <p className="text-sm text-[rgba(5,36,36,0.62)]">
              {player.role} · {player.club}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {player.badges.map((b) => (
                <span
                  key={b}
                  className="rounded-lg bg-[#E8B923]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#052424]"
                >
                  {b}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-semibold text-[#F5D04A]">Tape pour les stats →</p>
          </div>
        </div>

        <div className="absolute inset-0 overflow-hidden rounded-3xl border border-[#E8B923]/25 bg-[#052424] p-5 text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="font-display text-lg font-extrabold">{player.name}</p>
          <p className="text-sm text-white/55">Stats saison</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {player.stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-white/10 px-2 py-3 text-center">
                <p className="font-display text-xl font-extrabold text-[#5eead4]">{s.value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[11px] font-semibold text-[#fdba74]">← Retour profil</p>
        </div>
      </motion.div>
    </button>
  );
}

export function AlivePlayerCard({ players = DEFAULT_PLAYERS }: { players?: AlivePlayer[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {players.map((p) => (
        <PlayerCard key={p.name} player={p} />
      ))}
    </div>
  );
}
