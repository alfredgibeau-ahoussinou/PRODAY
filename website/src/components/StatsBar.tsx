"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { STATS, STATS_DISCLAIMER } from "@/lib/content";

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="font-display text-4xl font-bold text-[var(--proday-accent)] sm:text-5xl">
        {value}
      </div>
      <div className="mt-2 text-sm font-medium uppercase tracking-wide text-white/45">
        {label}
      </div>
    </motion.div>
  );
}

export function StatsBar({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`border-y border-[var(--proday-accent)]/10 bg-neutral-950 ${compact ? "py-10" : "py-16"}`}>
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-10 px-4 sm:grid-cols-4 sm:px-6">
        {STATS.map((s) => (
          <AnimatedStat key={s.label} value={s.value} label={s.label} />
        ))}
      </div>
      <p className="mx-auto mt-8 max-w-2xl px-4 text-center text-xs text-white/30 sm:px-6">
        {STATS_DISCLAIMER}
      </p>
    </section>
  );
}
