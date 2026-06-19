"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SPOTLIGHT_FEATURES } from "@/lib/content";
import { ROUTES } from "@/lib/routes";
import { Section } from "@/components/ui/Section";

const LINKS: Record<string, string> = {
  reels: ROUTES.demo,
  feed: ROUTES.demo,
  partners: ROUTES.partenaires,
  family: ROUTES.trust,
  tournaments: ROUTES.features,
  auth: ROUTES.demo,
};

export function SpotlightGrid() {
  return (
    <Section
      id="decouvrir"
      kicker="SIGNATURE"
      title="Les fondations de la plateforme"
      description="Reels, communauté, partenaires, famille et compétition — structurés autour de quatre pôles distincts."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SPOTLIGHT_FEATURES.map((item, i) => (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="card-premium group relative overflow-hidden rounded-2xl p-6 transition duration-300"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent} opacity-60 transition group-hover:opacity-100`}
            />
            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-wider text-white/45">
                {item.tagline}
              </p>
              <h3 className="font-display mt-2 text-xl font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{item.description}</p>
              <Link
                href={LINKS[item.id] ?? ROUTES.features}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 transition group-hover:gap-2.5 group-hover:text-white"
              >
                En savoir plus
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}
