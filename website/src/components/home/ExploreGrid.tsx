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
      kicker="GALERIE"
      title="Pages utiles"
      description="Démos, simulateur Visibilité, tarifs partenaires et étapes par rôle."
      className="border-t border-white/8 bg-neutral-950"
    >
      <div className="masonry-grid">
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
              className="card-flash group relative flex flex-col overflow-hidden rounded-2xl"
            >
              <div
                className={`relative overflow-hidden ${i % 3 === 1 ? "h-56" : i % 3 === 2 ? "h-44" : "h-48"}`}
              >
                <Image
                  src={card.image}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full border border-[var(--proday-accent)]/30 bg-black/50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--proday-accent)] backdrop-blur-sm">
                  {card.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-bold uppercase text-white">
                    {card.title}
                  </h3>
                  <ArrowUpRight
                    size={18}
                    className="shrink-0 text-[var(--proday-accent)]/50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--proday-accent)]"
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
