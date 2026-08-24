"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ExecutiveAppPhone } from "@/components/poles/ExecutiveAppPhone";
import { ROUTES } from "@/lib/routes";

const PRESIDENT_SIGNALS = [
  {
    tone: "ok" as const,
    label: "Ce qui va bien",
    body: "Équipes actives, convocations confirmées, calendrier rempli.",
  },
  {
    tone: "warn" as const,
    label: "À surveiller",
    body: "Comptes rendus manquants, besoins recrutement, validations en attente.",
  },
  {
    tone: "act" as const,
    label: "Décisions",
    body: "Adhésions, budget sponsors, validation tournoi ou équipement.",
  },
];

const HUB_BLOCKS = [
  {
    title: "Club Hub",
    body: "Matchs, équipes, coachs, tournois, bourse de recrutement, équipements et sponsors : découverts par sections, pas quinze boutons.",
  },
  {
    title: "Invitations de match",
    body: "Proposez un adversaire (nom, ville, distance, catégorie), acceptez ou contre proposez. Match confirmé → calendriers + convocations.",
  },
  {
    title: "Bourse de recrutement",
    body: "Avant de chercher dehors : besoins d’équipe, matching sur le vivier (équipe B, réserve, catégorie voisine), propositions de montée, puis publication entre clubs ProDay.",
  },
  {
    title: "Mercato club",
    body: "Suivi Observé → Contacté → Essai → Intégré. Après la bourse interne. Pas un pôle recruteur séparé.",
  },
  {
    title: "Tournois",
    body: "Générateur de poules, Hub en direct, classements auto, QR public. Organisateur = rôle intégré au Club.",
  },
  {
    title: "Écosystème local",
    body: "Place de marché équipements entre membres, micro sponsoring commerces, cagnottes avec règles du club.",
  },
];

/**
 * Espace Président / dirigeants : ancré dans le Pôle Club (pas un pôle séparé).
 */
export function ClubPresidentHub() {
  const reduce = useReducedMotion();

  return (
    <section
      id="president"
      className="relative scroll-mt-28 overflow-hidden border-t border-white/10 bg-[#020814] px-4 py-16 sm:px-6 sm:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 0%, rgba(30, 58, 255,0.35), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(76,139,255,0.12), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#7C3AED)]">
              Pôle Club · Président & dirigeants
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.75rem,4.2vw,3rem)] font-medium tracking-[-0.03em] text-white">
              Le président ouvre ProDay et comprend le club en quelques secondes.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              Dirigeants, DS et secrétariat pilotent depuis le Pôle Club : pas depuis un
              pôle séparé. Le coach prépare ; le président décide.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {PRESIDENT_SIGNALS.map((s, i) => (
                <motion.article
                  key={s.label}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="border border-white/10 bg-white/[0.03] p-5"
                >
                  <p
                    className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
                      s.tone === "ok"
                        ? "text-emerald-400"
                        : s.tone === "warn"
                          ? "text-amber-400"
                          : "text-[var(--pole-accent-bright,#F5D04A)]"
                    }`}
                  >
                    ● {s.label}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{s.body}</p>
                </motion.article>
              ))}
            </div>
          </div>

          <ExecutiveAppPhone className="mx-auto w-full lg:sticky lg:top-28" />
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <h3 className="font-display text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl">
              QG numérique du club amateur
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Avant, pendant et après le match. Permissions, confidentialité mineurs, et
              zéro donnée inventée.
            </p>
            <ul className="mt-6 space-y-5">
              {HUB_BLOCKS.map((b) => (
                <li
                  key={b.title}
                  className="border-l-2 border-[var(--pole-accent,#7C3AED)] pl-4"
                >
                  <p className="text-sm font-semibold text-white">{b.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/50">{b.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-end gap-6 border border-white/10 bg-gradient-to-br from-[#B8941F]/80 to-black p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Qui est sur le Pôle Club ?
            </p>
            <p className="font-display text-2xl font-medium tracking-[-0.02em] text-white">
              Présidents · DS · Secrétariat · Bureau
            </p>
            <p className="text-sm leading-relaxed text-white/55">
              Les coachs ont leur pôle dédié. Les organisateurs de tournois restent un rôle
              intégré ici. Agent et recruteur ne sont plus proposés comme rôles produit.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={ROUTES.betaWaitlist}
                className="inline-flex items-center justify-center bg-[var(--pole-accent,#7C3AED)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Rejoindre la bêta Club
              </Link>
              <Link
                href="#bourse"
                className="inline-flex items-center justify-center border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50"
              >
                Voir la bourse
              </Link>
              <Link
                href="#modules"
                className="inline-flex items-center justify-center border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50"
              >
                Voir les modules
              </Link>
              <Link
                href={ROUTES.coach}
                className="inline-flex items-center justify-center border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50"
              >
                Voir le Pôle Coach
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
