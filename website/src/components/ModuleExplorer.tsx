"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { Reveal } from "./Reveal";
import { UNIVERSE_THEME } from "@/components/universe/universeTheme";
import { MODULES } from "@/lib/content";

type ModuleExplorerProps = {
  compact?: boolean;
};

export function ModuleExplorer({ compact }: ModuleExplorerProps) {
  const [active, setActive] = useState(0);
  const mod = MODULES[active];
  const theme = UNIVERSE_THEME.homme;

  return (
    <section
      id={compact ? undefined : "modules"}
      className={compact ? "" : "scroll-mt-24 py-24"}
    >
      <div className={compact ? "" : "mx-auto max-w-6xl px-4 sm:px-6"}>
        {!compact && (
          <Reveal>
            <p className="text-sm font-medium tracking-widest text-proday-muted">
              MODULES
            </p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Quatre piliers. Une saison.
            </h2>
          </Reveal>
        )}

        <div
          className={`grid gap-8 lg:grid-cols-2 lg:items-stretch ${compact ? "mt-0" : "mt-12"}`}
        >
          <div className="flex flex-col gap-3">
            {MODULES.map((m, i) => (
              <motion.button
                key={m.id}
                type="button"
                onClick={() => setActive(i)}
                whileHover={{ x: 4 }}
                className={`rounded-2xl border p-5 text-left transition ${
                  active === i ? theme.moduleActive : theme.moduleIdle
                }`}
              >
                <span className="text-xs opacity-70">{m.subtitle}</span>
                <span className="mt-1 block text-xl font-bold">{m.title}</span>
                {active === i && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className={`mt-2 text-sm ${theme.moduleDesc}`}
                  >
                    {m.description}
                  </motion.p>
                )}
              </motion.button>
            ))}
          </div>

          <motion.div
            key={mod.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="relative aspect-[4/3] min-h-[320px] overflow-hidden rounded-3xl sm:min-h-[400px] lg:aspect-auto lg:min-h-[480px]"
          >
            <Image
              src={mod.image}
              alt={mod.title}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${theme.imageGradient}`} />
            <div className="absolute inset-x-0 bottom-0 p-8 pt-20">
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-bold text-white drop-shadow-sm"
              >
                {mod.title}
              </motion.h3>
              <p className="mt-2 max-w-sm text-sm text-white/90 drop-shadow-sm">{mod.description}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
