"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { LIVE_STAT_EVENTS } from "@/lib/content";

type Stats = { goals: number; assists: number; yellows: number; saves: number };

export function LiveStatsDemo() {
  const [stats, setStats] = useState<Stats>({
    goals: 0,
    assists: 0,
    yellows: 0,
    saves: 0,
  });
  const [minute, setMinute] = useState(0);

  function addEvent(type: keyof Stats) {
    setStats((s) => ({ ...s, [type]: s[type] + 1 }));
    setMinute((m) => Math.min(90, m + Math.floor(Math.random() * 8) + 3));
  }

  const total = stats.goals + stats.assists + stats.saves;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-3xl border border-neutral-200 bg-neutral-900 p-6 text-white sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400">MATCH EN DIRECT</p>
            <p className="text-2xl font-bold">FC ProDay 2 — 1 Rivaux</p>
          </div>
          <motion.span
            key={minute}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="rounded-full bg-red-600 px-4 py-1 text-sm font-bold"
          >
            {minute}&apos;
          </motion.span>
        </div>

        <div className="mt-8 grid grid-cols-4 gap-4">
          {(
            [
              ["goals", stats.goals, "Buts"],
              ["assists", stats.assists, "Passes"],
              ["yellows", stats.yellows, "Jaunes"],
              ["saves", stats.saves, "Arrêts"],
            ] as const
          ).map(([key, val, label]) => (
            <motion.div
              key={key}
              layout
              className="rounded-xl bg-white/10 p-4 text-center"
            >
              <motion.p
                key={val}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold"
              >
                {val}
              </motion.p>
              <p className="mt-1 text-xs text-neutral-400">{label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {LIVE_STAT_EVENTS.map((ev) => (
            <button
              key={ev.type}
              type="button"
              onClick={() =>
                addEvent(
                  ev.type === "goal"
                    ? "goals"
                    : ev.type === "assist"
                      ? "assists"
                      : ev.type === "yellow"
                        ? "yellows"
                        : "saves",
                )
              }
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
            >
              + {ev.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setStats({ goals: 0, assists: 0, yellows: 0, saves: 0 });
              setMinute(0);
            }}
            className="rounded-full px-4 py-2 text-sm text-neutral-400 hover:text-white"
          >
            Reset
          </button>
        </div>
      </div>

      <motion.div
        layout
        className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6"
      >
        <p className="text-sm font-medium text-proday-muted">Impact profil</p>
        <p className="mt-2 text-lg">
          <strong>{total}</strong> actions enregistrées → stats saison et CV mis
          à jour automatiquement.
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
          <motion.div
            className="h-full bg-proday-ink"
            animate={{ width: `${Math.min(100, total * 12)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-proday-muted">
          Complétion profil Live Stats : {Math.min(100, total * 12)}%
        </p>
      </motion.div>
    </div>
  );
}
