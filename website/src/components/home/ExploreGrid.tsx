"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import {
  UNIVERSE_THEME,
  universeFromExploreHref,
} from "@/components/universe/universeTheme";
import { EXPLORE_CARDS } from "@/lib/routes";

export function ExploreGrid() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <h2 className="text-3xl font-bold sm:text-4xl">Explorer ProDay</h2>
          <p className="mt-3 max-w-xl text-proday-muted">
            Chaque page est une expérience dédiée — démos interactives, simulateurs
            et parcours détaillés.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {EXPLORE_CARDS.map((card, i) => {
            const line = universeFromExploreHref(card.href);
            const theme = line ? UNIVERSE_THEME[line] : null;

            return (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  href={card.href}
                  className={`group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl border transition hover:shadow-xl ${
                    theme ? theme.exploreCard : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div className="relative h-32 overflow-hidden">
                    <Image
                      src={card.image}
                      alt=""
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span
                      className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-medium ${
                        theme ? theme.exploreBadge : "bg-white/90 text-proday-ink"
                      }`}
                    >
                      {card.tag}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold">{card.title}</h3>
                      <ArrowUpRight
                        size={18}
                        className="shrink-0 text-proday-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-proday-ink"
                      />
                    </div>
                    <p className="mt-2 flex-1 text-sm text-proday-muted leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
