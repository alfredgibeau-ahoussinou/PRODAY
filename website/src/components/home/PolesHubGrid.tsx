"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { POLES, POLE_STYLES } from "@/lib/poles";
import { Section } from "@/components/ui/Section";

const POLE_IMAGES: Record<string, string> = {
  joueur: "/showcase/classic-discover-hero.jpg",
  pro: "/showcase/classic-staff.jpg",
  sante: "/showcase/classic-exp-profile.jpg",
  sponsor: "/showcase/classic-exp-sponsors.jpg",
};

export function PolesHubGrid() {
  return (
    <Section
      kicker="4 PÔLES"
      title="Un écosystème, quatre univers distincts"
      description="Joueur, Pro, Santé ou Partenaires — chaque pôle dispose de sa page, de ses tarifs et de son identité."
      className="bg-[#030303]"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {POLES.map((pole, i) => {
          const styles = POLE_STYLES[pole.id];
          return (
            <motion.div
              key={pole.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`group relative overflow-hidden rounded-3xl card-premium p-8 ring-1 ring-white/10 ${styles.accentTop}`}
            >
              <div className="relative flex items-start gap-4">
                <Image
                  src={pole.logo}
                  alt=""
                  width={52}
                  height={52}
                  className="shrink-0 rounded-xl bg-white/10 ring-1 ring-white/20"
                />
                <div>
                  <p className={`text-xs font-semibold tracking-widest ${styles.textMuted}`}>
                    {pole.kicker}
                  </p>
                  <h3 className="font-display mt-1 text-xl font-bold text-white sm:text-2xl">
                    {pole.title}
                  </h3>
                  <p className={`mt-1 text-sm ${styles.textMuted}`}>{pole.subtitle}</p>
                </div>
              </div>
              <p className="relative mt-4 text-sm leading-relaxed text-white/70">
                {pole.description}
              </p>
              <div className="relative mt-6 flex flex-wrap gap-3">
                <Link
                  href={pole.href}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition hover:scale-[1.02] ${styles.cta}`}
                >
                  En savoir plus
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href={`/tarifs#${pole.pricingHash}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                >
                  Tarifs
                </Link>
              </div>
              <div className="relative mt-6 h-28 overflow-hidden rounded-2xl ring-1 ring-white/10">
                <Image
                  src={POLE_IMAGES[pole.id]}
                  alt=""
                  fill
                  className="object-cover opacity-80 transition group-hover:scale-105"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
