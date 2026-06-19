"use client";

import { motion } from "framer-motion";
import { Check, Circle, Loader2 } from "lucide-react";
import { ROADMAP_ITEMS } from "@/lib/content";

export function RoadmapTimeline() {
  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 sm:px-6">
      {ROADMAP_ITEMS.map((phase, pi) => (
        <motion.div
          key={phase.phase}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: pi * 0.1 }}
          className="relative pl-10"
        >
          <div
            className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full ${
              phase.status === "done"
                ? "bg-emerald-500/20 text-emerald-300"
                : phase.status === "active"
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-white/10 text-white/40"
            }`}
          >
            {phase.status === "done" ? (
              <Check size={16} />
            ) : phase.status === "active" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Circle size={14} />
            )}
          </div>
          {pi < ROADMAP_ITEMS.length - 1 && (
            <div className="absolute left-4 top-10 h-full w-px bg-white/10" />
          )}
          <h3 className="font-display text-xl font-bold text-white">{phase.phase}</h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {phase.items.map((item) => (
              <li
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
              >
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}
