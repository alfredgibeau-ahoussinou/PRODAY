"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

const BADGES = [
  { id: "streak", label: "Série 7j", emoji: "🔥", progress: 0.85, detail: "7 jours d’activité d’affilée" },
  { id: "rsvp", label: "Réactif", emoji: "⚡", progress: 1, detail: "100 % de RSVP cette semaine" },
  { id: "assist", label: "Passeur", emoji: "🎯", progress: 0.6, detail: "3 passes décisives / 5" },
  { id: "covoit", label: "Covoiturier", emoji: "🚗", progress: 0.4, detail: "2 trajets / 5" },
  { id: "pulse", label: "Pulse", emoji: "✨", progress: 0.72, detail: "Score Pulse en hausse" },
] as const;

function Ring({ progress, active }: { progress: number; active: boolean }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#f3f2ec" strokeWidth="5" />
      <motion.circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke={active ? "#E8B923" : "#E8B923"}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

export function AliveBadgeRow() {
  const [active, setActive] = useState<string | null>(BADGES[0].id);
  const current = BADGES.find((b) => b.id === active) ?? BADGES[0];

  return (
    <div className="rounded-[1.75rem] border border-[#052424]/10 bg-white p-4 shadow-[0_18px_40px_-28px_rgba(15,31,23,0.28)] sm:p-5">
      <div className="flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {BADGES.map((b) => {
          const on = active === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setActive(b.id)}
              className={clsx(
                "relative flex min-w-[88px] flex-col items-center gap-1 rounded-2xl px-2 py-3 transition",
                on ? "bg-[#f3f2ec] ring-2 ring-[#E8B923]/40" : "hover:bg-[#f3f2ec]/70",
              )}
            >
              <div className="relative">
                <Ring progress={b.progress} active={on} />
                <span className="absolute inset-0 flex items-center justify-center text-lg">
                  {b.emoji}
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#052424]">{b.label}</span>
            </button>
          );
        })}
      </div>
      <motion.p
        key={current.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 rounded-2xl bg-[#f3f2ec] px-4 py-3 text-sm text-[#052424]"
      >
        <span className="font-extrabold">{current.emoji} {current.label}</span>
        <span className="text-[rgba(5,36,36,0.62)]"> · {current.detail}</span>
      </motion.p>
    </div>
  );
}
