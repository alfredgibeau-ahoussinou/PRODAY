"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import type { UniverseModule } from "@/lib/content";
import type { UniverseThemeId } from "./universeTheme";
import { UNIVERSE_THEME } from "./universeTheme";

type UniverseModuleExplorerProps = {
  universe: UniverseThemeId;
  modules: readonly UniverseModule[];
};

export function UniverseModuleExplorer({
  universe,
  modules,
}: UniverseModuleExplorerProps) {
  const [active, setActive] = useState(0);
  const mod = modules[active] ?? modules[0];
  const theme = UNIVERSE_THEME[universe];

  if (!mod) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
      <div className="flex flex-col gap-2">
        {modules.map((m, i) => {
          const isActive = active === i;
          return (
            <motion.button
              key={m.id}
              type="button"
              onClick={() => setActive(i)}
              whileHover={{ x: 3 }}
              className={`rounded-2xl border px-4 py-4 text-left transition sm:px-5 ${
                isActive
                  ? theme.moduleActive
                  : `${theme.moduleIdle} text-white/75`
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`font-display mt-0.5 text-xs font-bold tabular-nums ${
                    isActive ? "opacity-90" : "opacity-40"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
                    {m.subtitle}
                  </span>
                  <span className="mt-1 block font-display text-lg font-bold sm:text-xl">
                    {m.title}
                  </span>
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={`mt-2 text-sm leading-relaxed ${theme.moduleDesc}`}
                    >
                      {m.description}
                    </motion.p>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        key={mod.id}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className={`relative aspect-[4/3] min-h-[320px] overflow-hidden rounded-[1.75rem] sm:min-h-[420px] lg:min-h-full lg:aspect-auto ${theme.imageRing}`}
      >
        <Image
          src={mod.image}
          alt={mod.title}
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
          loading="lazy"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${theme.imageGradient}`} />
        <div className="absolute inset-x-0 bottom-0 p-7 pt-28 sm:p-9">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
            {mod.subtitle}
          </p>
          <h3 className="font-display mt-2 text-2xl font-extrabold text-white sm:text-3xl">
            {mod.title}
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">
            {mod.description}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
