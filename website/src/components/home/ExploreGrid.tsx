"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EXPLORE_CARDS } from "@/lib/routes";
import { Section } from "@/components/ui/Section";

export function ExploreGrid() {
  return (
    <Section
      kicker="EXPLORER"
      title="Chaque page, une expérience"
      description="Démos interactives, simulateurs Pulse, tarifs partenaires et parcours par rôle."
      className="border-t border-white/8 bg-[#050505]"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {EXPLORE_CARDS.map((card, i) => (
          <motion.div
            key={card.href}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              href={card.href}
              className="card-premium group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl transition duration-300"
            >
              <div className="relative h-32 overflow-hidden">
                <Image
                  src={card.image}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/40 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {card.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-bold text-white">{card.title}</h3>
                  <ArrowUpRight
                    size={18}
                    className="shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                  />
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/50">
                  {card.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
