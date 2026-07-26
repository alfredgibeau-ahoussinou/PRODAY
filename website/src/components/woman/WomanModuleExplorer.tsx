"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { WOMAN_MODULES } from "@/lib/content";
import { UNIVERSE_THEME } from "@/components/universe/universeTheme";

const theme = UNIVERSE_THEME.woman;

export function WomanModuleExplorer() {
  const [active, setActive] = useState(0);
  const mod = WOMAN_MODULES[active];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-stretch">
        <div className="flex flex-col gap-3">
          {WOMAN_MODULES.map((m, i) => (
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
          className={`relative min-h-[400px] overflow-hidden rounded-3xl ${theme.imageRing}`}
        >
          <Image src={mod.image} alt={mod.title} fill className="object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-pink-950/80 via-pink-900/20 to-transparent" />
          <div className="absolute bottom-0 p-8">
            <h3 className="text-2xl font-bold text-white">{mod.title}</h3>
            <p className="mt-2 max-w-sm text-pink-100">{mod.description}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
