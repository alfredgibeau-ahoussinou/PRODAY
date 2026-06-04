"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { Reveal } from "./Reveal";
import { MODULES } from "@/lib/content";

type ModuleExplorerProps = {
  compact?: boolean;
};

export function ModuleExplorer({ compact }: ModuleExplorerProps) {
  const [active, setActive] = useState(0);
  const mod = MODULES[active];

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
                  active === i
                    ? "border-proday-ink bg-proday-ink text-white shadow-lg"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <span className="text-xs opacity-70">{m.subtitle}</span>
                <span className="mt-1 block text-xl font-bold">{m.title}</span>
                {active === i && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 text-sm text-white/80"
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
            className="relative min-h-[400px] overflow-hidden rounded-3xl"
          >
            <Image
              src={mod.image}
              alt={mod.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 p-8">
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl font-bold text-white"
              >
                {mod.title}
              </motion.h3>
              <p className="mt-2 max-w-sm text-white/85">{mod.description}</p>
            </div>
            <motion.div
              className="absolute right-6 top-6 h-16 w-16 rounded-full border-2 border-white/30"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
