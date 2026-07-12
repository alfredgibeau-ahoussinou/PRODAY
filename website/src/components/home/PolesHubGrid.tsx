"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CAROUSEL_POLES, POLE_IMAGES, POLE_STYLES, poleSectionHref } from "@/lib/poles";
import { Section } from "@/components/ui/Section";

export function PolesHubGrid() {
  return (
    <Section
      kicker="PÔLES POPULAIRES"
      title="Six univers, une plateforme"
      description="Amateur, Supporter, Santé, Pro Joueur, Pro Club ou Pro Staff — chaque pôle a sa page, ses tarifs et son identité."
      className="bg-black"
    >
      <div className="flex flex-col gap-5">
        {CAROUSEL_POLES.map((pole, i) => {
          const styles = POLE_STYLES[pole.id];
          return (
            <motion.article
              key={pole.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card-flash group grid overflow-hidden sm:grid-cols-[minmax(0,280px)_1fr] lg:grid-cols-[minmax(0,340px)_1fr]"
            >
              <div className="relative h-48 sm:h-auto sm:min-h-[200px]">
                <Image
                  src={POLE_IMAGES[pole.id]}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/60 sm:bg-gradient-to-t sm:from-black/80 sm:to-transparent" />
                <span className="absolute left-4 top-4 font-display text-3xl font-bold text-[var(--proday-accent)]/80">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="flex flex-col justify-center p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <Image
                    src={pole.logo}
                    alt=""
                    width={44}
                    height={44}
                    className="shrink-0 rounded-xl bg-white/10 ring-1 ring-white/15"
                  />
                  <div>
                    <p
                      className={`text-xs font-bold uppercase tracking-widest ${styles.textMuted}`}
                    >
                      {pole.kicker}
                    </p>
                    <h3 className="font-display mt-1 text-xl font-bold uppercase text-white sm:text-2xl">
                      {pole.title}
                    </h3>
                    <p className={`mt-1 text-sm ${styles.textMuted}`}>{pole.subtitle}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/65">
                  {pole.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={poleSectionHref(pole)}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition hover:scale-[1.02] ${styles.cta}`}
                  >
                    En savoir plus
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href={`/tarifs#${pole.pricingHash}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/75 transition hover:border-[var(--proday-accent)] hover:text-[var(--proday-accent)]"
                  >
                    Tarifs
                  </Link>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </Section>
  );
}
