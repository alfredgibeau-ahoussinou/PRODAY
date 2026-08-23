"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LivePulse } from "@/components/motion/AliveMotion";

const BASE = [
  { label: "Matchs joués", value: 128, suffix: "" },
  { label: "RSVP reçus", value: 842, suffix: "" },
  { label: "Covoits", value: 56, suffix: "" },
  { label: "Profils actifs", value: 31, suffix: "%" },
] as const;

/** Stats qui « vivent » : tick léger pour l’énergie match. */
export function AliveStatStrip() {
  const [vals, setVals] = useState<number[]>(() => BASE.map((b) => b.value));

  useEffect(() => {
    const id = window.setInterval(() => {
      setVals((prev) =>
        prev.map((v, i) => {
          const delta = i === 3 ? (Math.random() > 0.5 ? 1 : 0) : Math.floor(Math.random() * 3);
          return v + delta;
        }),
      );
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-[1.75rem] border border-[#052424]/10 bg-white p-4 shadow-[0_18px_40px_-28px_rgba(15,31,23,0.28)] sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5B75FF]">
        <LivePulse />
        En direct · communauté
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {BASE.map((b, i) => (
          <div key={b.label} className="rounded-2xl bg-[#f3f2ec] px-3 py-4 text-center">
            <motion.p
              key={vals[i]}
              initial={{ y: 6, opacity: 0.4 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-display text-2xl font-extrabold text-[#052424] sm:text-3xl"
            >
              {vals[i]}
              {b.suffix}
            </motion.p>
            <p className="mt-1 text-xs font-semibold text-[rgba(5,36,36,0.62)]">{b.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
