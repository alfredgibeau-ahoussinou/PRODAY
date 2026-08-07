"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Calendar,
  Car,
  FileText,
  Film,
  LayoutGrid,
  Shield,
  Stethoscope,
  Trophy,
  Users,
  Briefcase,
  Rss,
} from "lucide-react";
import { ALL_PILLARS, PILLARS } from "@/lib/content";
import { Section } from "@/components/ui/Section";

const ICON_MAP: Record<string, typeof Users> = {
  unified: Users,
  trust: Shield,
  cv: FileText,
  live: Activity,
  feed: Rss,
  reels: Film,
  sponsors: Briefcase,
  "pulse-pillar": Activity,
  "recruit-pillar": Users,
  "matches-pillar": Trophy,
  "calendar-pillar": Calendar,
  "carpool-pillar": Car,
  "health-pillar": Stethoscope,
  "shop-pillar": Trophy,
  "feed-pillar": Rss,
  "reels-pillar": Film,
  "sponsors-pillar": Briefcase,
  "family-pillar": Shield,
};

const DEFAULT_ICON = LayoutGrid;

type FeaturesBentoProps = {
  extended?: boolean;
  compact?: boolean;
};

export function FeaturesBento({ extended, compact }: FeaturesBentoProps) {
  const items = extended ? ALL_PILLARS : PILLARS;

  const grid = (
    <div
      className={`grid gap-4 sm:grid-cols-2 ${extended ? "lg:grid-cols-4" : "lg:grid-cols-4"}`}
    >
      {items.map((p, i) => {
        const Icon = ICON_MAP[p.id] ?? DEFAULT_ICON;
        const featured = i === 0;
        return (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: Math.min(i * 0.04, 0.28), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className={`card-flash group rounded-2xl p-6 ${
              featured ? "sm:col-span-2" : ""
            }`}
          >
            <div className="mb-4 inline-flex rounded-xl border border-[var(--proday-accent)]/20 bg-[var(--proday-accent-muted)] p-3 text-[var(--proday-accent)] transition group-hover:border-[var(--proday-accent)]/50 group-hover:shadow-[0_0_16px_rgba(34,211,238,0.15)]">
              <Icon size={22} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--proday-accent)]/70">
              {p.subtitle}
            </p>
            <h3 className="font-display mt-1 text-lg font-bold uppercase text-[#0f1f17]">
              {p.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#4a6356]">{p.description}</p>
          </motion.article>
        );
      })}
    </div>
  );

  if (extended) {
    return (
      <section className="border-t border-[#0f1f17]/8 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.28em] text-[#FF5A1F]">
            Piliers
          </p>
          <h2 className="font-display mt-3 text-center text-3xl font-extrabold tracking-[-0.03em] text-[#0f1f17]">
            12 piliers produit
          </h2>
          <div className="mt-12">{grid}</div>
        </div>
      </section>
    );
  }

  return (
    <Section
      kicker="FONCTIONNALITÉS"
      title="Tout ce qui fait ProDay"
      description="Recrutement, saison, santé, communauté et partenaires. Pour le foot amateur et semi-pro."
      className="bg-[#eef6f1]"
      compact={compact}
    >
      {grid}
    </Section>
  );
}
