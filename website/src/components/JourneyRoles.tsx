"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Reveal } from "./Reveal";
import { JOURNEYS } from "@/lib/content";

type JourneyRolesProps = { fullPage?: boolean };

export function JourneyRoles({ fullPage }: JourneyRolesProps) {
  const [active, setActive] = useState(0);
  const journey = JOURNEYS[active];

  return (
    <section
      className={`gradient-mesh ${fullPage ? "py-12" : "scroll-mt-24 py-24"}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {!fullPage && (
          <Reveal>
            <p className="text-sm font-medium tracking-widest text-proday-muted">
              PARCOURS
            </p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Chaque rôle, un chemin clair
            </h2>
          </Reveal>
        )}

        <div className={`flex flex-wrap gap-2 ${fullPage ? "mt-4" : "mt-10"}`}>
          {JOURNEYS.map((j, i) => (
            <button
              key={j.id}
              type="button"
              onClick={() => setActive(i)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                active === i
                  ? "bg-proday-ink text-white shadow-md"
                  : "bg-white text-proday-muted ring-1 ring-neutral-200 hover:ring-neutral-300"
              }`}
            >
              <span className="mr-1.5">{j.emoji}</span>
              {j.role}
            </button>
          ))}
        </div>

        <motion.ol
          key={journey.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {journey.steps.map((step, i) => (
            <motion.li
              key={step}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-lg font-bold">
                {i + 1}
              </span>
              <p className="mt-4 font-medium leading-snug">{step}</p>
              {i < journey.steps.length - 1 && (
                <span className="absolute -right-2 top-1/2 hidden h-0.5 w-4 bg-neutral-300 lg:block" />
              )}
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
