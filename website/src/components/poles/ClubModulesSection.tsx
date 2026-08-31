"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PRO_CLUB_MODULES } from "@/lib/content";

/**
 * Modules club restaurés — une section, une intention : le produit avant les tarifs.
 */
export function ClubModulesSection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="modules"
      className="relative overflow-hidden border-t border-white/10 bg-black px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="relative mx-auto max-w-7xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#7C3AED)]">
          Piloter le club
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.75rem,4.2vw,3rem)] font-medium tracking-[-0.03em] text-white">
          Tout le vivier. Toutes les équipes. Un seul endroit.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
          Équipes, licenciés, bourse interne, convocations, covoiturage et vitrine ·
          le cœur de ProDay pour le bureau et la direction sportive.
        </p>

        <ul className="mt-12 grid gap-0 border-t border-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {PRO_CLUB_MODULES.map((m, i) => (
            <motion.li
              key={m.id}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              className="border-b border-white/10 p-5 sm:border-r sm:odd:[&:nth-last-child(-n+2)]:border-b-0 lg:[&:nth-child(3n)]:border-r-0"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--pole-accent,#7C3AED)]">
                {m.subtitle}
              </p>
              <h3 className="mt-3 font-display text-lg font-medium tracking-[-0.02em] text-white">
                {m.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{m.description}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
