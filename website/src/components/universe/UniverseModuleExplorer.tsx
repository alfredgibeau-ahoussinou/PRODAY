"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import type { ProductLineWeb, UniverseModule } from "@/lib/content";
import { UNIVERSE_THEME } from "./universeTheme";

type UniverseModuleExplorerProps = {
  universe: ProductLineWeb;
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
    <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-stretch">
      <div className="flex flex-col gap-3">
        {modules.map((m, i) => (
          <motion.button
            key={m.id}
            type="button"
            onClick={() => setActive(i)}
            whileHover={{ x: 4 }}
            className={`rounded-2xl border p-5 text-left transition ${
              active === i
                ? theme.moduleActive
                : `${theme.moduleIdle} text-white/80`
            }`}
          >
            <span className="text-xs opacity-80">{m.subtitle}</span>
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
        className={`relative aspect-[4/3] min-h-[320px] overflow-hidden rounded-3xl sm:min-h-[420px] lg:min-h-[520px] lg:aspect-auto ${theme.imageRing}`}
      >
        <Image
          src={mod.image}
          alt={mod.title}
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${theme.imageGradient}`} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-8 pt-24">
          <h3 className="text-2xl font-bold text-white drop-shadow-sm">{mod.title}</h3>
          <p className="mt-2 max-w-sm text-sm text-white/90 drop-shadow-sm">
            {mod.description}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
