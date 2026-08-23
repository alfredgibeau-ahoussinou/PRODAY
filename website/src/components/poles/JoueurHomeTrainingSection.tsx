"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { JoueurAgeGroup } from "@/lib/joueurExperienceTheme";
import { ROUTES } from "@/lib/routes";

const PATHS = [
  {
    title: "À la maison",
    body: "Exercices selon âge, poste et matériel. Seul, jardin ou city stade.",
  },
  {
    title: "Avec ma famille",
    body: "Consignes claires pour père, mère, frère ou sœur. Partenaire indiqué.",
  },
  {
    title: "Avec un coach",
    body: "Réserve un coach humain : créneau, durée, paiement à l’heure. Sans abonnement obligatoire.",
  },
] as const;

type Props = {
  kicker?: string;
  title?: string;
  body?: string;
  poster?: string;
  ageGroup?: JoueurAgeGroup;
};

/**
 * Module joueur : entraînement domicile + coaching à l’heure.
 * Copy / image adaptés au thème âge.
 */
export function JoueurHomeTrainingSection({
  kicker = "Je veux m’entraîner",
  title = "Chez toi. Avec ta famille. Avec un vrai coach.",
  body = "ProDay ne remplace pas le coach. Il lui donne les outils pour accompagner le joueur partout, même hors du stade. Coaching humain payé à la séance, pas un forfait mensuel.",
  poster,
  ageGroup = "adult",
}: Props) {
  const reduce = useReducedMotion();

  return (
    <section
      id="entrainement"
      className="relative overflow-hidden border-t border-white/10 bg-[#020617] px-4 py-16 sm:px-6 sm:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 15% 20%, var(--joueur-wash, rgba(30, 58, 255,0.3)), transparent 55%), radial-gradient(ellipse 40% 35% at 90% 80%, rgba(76,139,255,0.12), transparent 50%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#FFFFFF)]">
              {kicker}
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.75rem,4.2vw,3rem)] font-medium tracking-[-0.03em] text-white">
              {title}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              {body}
            </p>
          </div>
          {poster ? (
            <div className="relative aspect-[16/10] overflow-hidden lg:aspect-[4/3]">
              <Image
                src={poster}
                alt=""
                fill
                className="object-cover opacity-80"
                sizes="(max width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#020617]/80" />
              <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                {ageGroup === "youth"
                  ? "Défis · progression"
                  : ageGroup === "teen"
                    ? "Objectifs · niveau"
                    : "Performance · data"}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {PATHS.map((p, i) => (
            <motion.article
              key={p.title}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="border border-white/10 bg-white/[0.03] p-5"
            >
              <h3 className="font-display text-lg font-medium text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{p.body}</p>
            </motion.article>
          ))}
        </div>

        <p className="mt-8 max-w-2xl text-sm text-white/45">
          Exemple : séance 30 €/h → coach 25 € · ProDay 3 € · club 2 €. Les
          commissions sont configurables depuis l’administration.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={ROUTES.betaWaitlist}
            className="inline-flex bg-[var(--pole-accent,#FFFFFF)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Tester dans la bêta
          </Link>
          <Link
            href={ROUTES.coach}
            className="inline-flex border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            Espace Coach
          </Link>
        </div>
      </div>
    </section>
  );
}
