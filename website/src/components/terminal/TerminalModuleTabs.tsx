"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CinematicBleed } from "@/components/immersive/CinematicBleed";

export type TerminalModuleTab = {
  id: string;
  label: string;
  title: string;
  body: string;
};

type TerminalModuleTabsProps = {
  kicker?: string;
  title: string;
  description?: string;
  tabs: TerminalModuleTab[];
  image?: string;
  className?: string;
  id?: string;
};

/** Tabbed platform modules over one cinematic plane. */
export function TerminalModuleTabs({
  kicker = "Platform",
  title,
  description,
  tabs,
  image,
  className = "",
  id,
}: TerminalModuleTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  if (!current) return null;

  return (
    <section
      id={id}
      className={`relative scroll-mt-28 overflow-hidden border-b border-white/10 bg-[#050505] px-4 py-16 sm:px-6 sm:py-24 ${className}`}
    >
      {image ? <CinematicBleed src={image} opacity={0.22} vignette /> : null}

      <div className="relative mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#4C8BFF)]">
          {kicker}
        </p>
        <h2 className="mt-4 max-w-3xl font-display text-[clamp(1.75rem,4vw,3rem)] font-medium leading-[1.08] tracking-[-0.035em] text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/55">
            {description}
          </p>
        ) : null}

        <div
          className="mt-10 flex flex-wrap gap-2 border-b border-white/10 pb-4"
          role="tablist"
          aria-label="Modules"
        >
          {tabs.map((tab) => {
            const pressed = tab.id === current.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={pressed}
                onClick={() => setActive(tab.id)}
                className={`rounded-full px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] transition ${
                  pressed
                    ? "bg-accent-gradient text-white"
                    : "border border-white/15 text-white/55 hover:border-white/35 hover:text-[var(--pole-accent,#4C8BFF)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.article
            key={current.id}
            role="tabpanel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mt-10 max-w-2xl"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--pole-accent,#4C8BFF)]/70">
              {current.label}
            </p>
            <h3 className="mt-4 font-display text-2xl font-medium tracking-[-0.02em] text-white sm:text-3xl">
              {current.title}
            </h3>
            <p className="mt-5 text-base leading-relaxed text-white/55">
              {current.body}
            </p>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  );
}
