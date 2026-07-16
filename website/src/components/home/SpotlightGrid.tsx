"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SPOTLIGHT_FEATURES } from "@/lib/content";
import { ROUTES, routeWithHash } from "@/lib/routes";
import { Section } from "@/components/ui/Section";

const LINKS: Record<string, string> = {
  reels: ROUTES.demo,
  feed: ROUTES.demo,
  partners: routeWithHash(ROUTES.sponsor, "formules"),
  family: routeWithHash(ROUTES.trust, "verification"),
  tournaments: routeWithHash(ROUTES.features, "modules"),
  auth: ROUTES.demo,
};

export function SpotlightGrid() {
  return (
    <Section
      id="decouvrir"
      kicker="SIGNATURE"
      title="Les fondations de la plateforme"
      description="Reels, communauté, partenaires, famille et compétition — structurés autour de six pôles distincts."
      className="bg-black"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SPOTLIGHT_FEATURES.map((item, i) => (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="card-flash group relative overflow-hidden rounded-2xl p-6"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent} opacity-40 transition group-hover:opacity-70`}
            />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--proday-accent)]">
                {item.tagline}
              </p>
              <h3 className="font-display mt-2 text-xl font-bold uppercase text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{item.description}</p>
              <Link
                href={LINKS[item.id] ?? ROUTES.features}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--proday-accent)] transition group-hover:gap-2.5"
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
