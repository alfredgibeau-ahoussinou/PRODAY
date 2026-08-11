"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import { LivePulse } from "@/components/motion/AliveMotion";

const TABS = ["Direct", "Compo", "Stats"] as const;

const EVENTS = [
  { min: "12'", text: "But · Amine (ProDay FC)", tone: "goal" },
  { min: "28'", text: "Carton jaune · Dupont", tone: "card" },
  { min: "41'", text: "Remplaçant prêt · #17", tone: "sub" },
  { min: "54'", text: "But · Lopez (Visiteurs)", tone: "goal" },
] as const;

const XI = [
  "GK · Martin",
  "DF · Benali",
  "DF · Rossi",
  "MF · Amine",
  "MF · Dupont",
  "FW · Lopez",
] as const;

const STATS = [
  { label: "Possession", home: 58, away: 42 },
  { label: "Tirs", home: 11, away: 7 },
  { label: "Corners", home: 5, away: 3 },
] as const;

/** Match center interactif : mock local. */
export function AliveMatchCenter() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Direct");
  const [minute, setMinute] = useState(67);
  const [score, setScore] = useState({ home: 2, away: 1 });

  function nudge() {
    setMinute((m) => Math.min(90, m + 1));
    if (Math.random() > 0.72) {
      setScore((s) =>
        Math.random() > 0.5 ? { ...s, home: s.home + 1 } : { ...s, away: s.away + 1 },
      );
    }
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#052424]/10 bg-white shadow-[0_24px_50px_-28px_rgba(15,31,23,0.35)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#052424]/8 bg-[#052424] px-4 py-3 text-white sm:px-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <LivePulse />
          Live · {minute}&apos;
        </div>
        <button
          type="button"
          onClick={nudge}
          className="bg-accent-gradient rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110 active:scale-95"
        >
          +1 min
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-6 sm:px-6">
        <div className="text-right">
          <p className="font-display text-lg font-extrabold text-[#052424] sm:text-xl">ProDay FC</p>
          <p className="text-xs text-[rgba(5,36,36,0.62)]">Domicile</p>
        </div>
        <div className="rounded-2xl bg-[#f3f2ec] px-4 py-2 text-center">
          <p className="font-display text-3xl font-extrabold tracking-tight text-[#052424] sm:text-4xl">
            {score.home}
            <span className="mx-1 text-[#052424]/40">…</span>
            {score.away}
          </p>
        </div>
        <div>
          <p className="font-display text-lg font-extrabold text-[#052424] sm:text-xl">Visiteurs</p>
          <p className="text-xs text-[rgba(5,36,36,0.62)]">Extérieur</p>
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-3 sm:px-5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={clsx(
              "rounded-xl px-4 py-2 text-sm font-bold transition",
              tab === t
                ? "bg-accent-gradient text-white"
                : "bg-[#f3f2ec] text-[#052424]/70 hover:text-[#052424]",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="min-h-[180px] border-t border-[#052424]/8 px-4 py-4 sm:px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            {tab === "Direct" ? (
              <ul className="space-y-2.5">
                {EVENTS.map((e) => (
                  <li
                    key={`${e.min}-${e.text}`}
                    className="flex items-start gap-3 rounded-xl bg-[#f3f2ec] px-3 py-2.5"
                  >
                    <span className="shrink-0 rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-[#4C8BFF]">
                      {e.min}
                    </span>
                    <span className="text-sm text-[#052424]">{e.text}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {tab === "Compo" ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {XI.map((p) => (
                  <div
                    key={p}
                    className="rounded-xl border border-[#052424]/8 bg-[#f3f2ec] px-3 py-3 text-sm font-semibold text-[#052424]"
                  >
                    {p}
                  </div>
                ))}
              </div>
            ) : null}
            {tab === "Stats" ? (
              <div className="space-y-4">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <div className="mb-1 flex justify-between text-xs font-bold text-[rgba(5,36,36,0.62)]">
                      <span>{s.home}</span>
                      <span>{s.label}</span>
                      <span>{s.away}</span>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-[#f3f2ec]">
                      <div
                        className="h-full bg-[#0054F0]"
                        style={{ width: `${(s.home / (s.home + s.away)) * 100}%` }}
                      />
                      <div
                        className="h-full bg-[#0054F0]"
                        style={{ width: `${(s.away / (s.home + s.away)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
