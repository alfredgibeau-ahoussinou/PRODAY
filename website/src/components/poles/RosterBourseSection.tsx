"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { ROUTES } from "@/lib/routes";

type Audience = "club" | "coach";

type Scope = "internal" | "external" | "moves";

const NEEDS = [
  {
    id: "u15-lat",
    team: "U15 A",
    post: "Latéral droit",
    why: "Blessure longue durée, match samedi",
  },
  {
    id: "seniors-meneur",
    team: "Seniors 1",
    post: "Milieu relayeur",
    why: "Départ, effectif à 14",
  },
  {
    id: "u18-att",
    team: "U18 Filles",
    post: "Attaquante axe",
    why: "Convocation fédérale, weekend chargé",
  },
] as const;

const INTERNAL_MATCHES: Record<
  string,
  { name: string; from: string; score: number; note: string }[]
> = {
  "u15-lat": [
    {
      name: "Léo M.",
      from: "U15 B",
      score: 92,
      note: "Même catégorie, montée temporaire possible",
    },
    {
      name: "Noa R.",
      from: "U14 A",
      score: 84,
      note: "Surclassement déjà validé cette saison",
    },
    {
      name: "Amine K.",
      from: "U16 réserve",
      score: 78,
      note: "Profil latéral, dispo entraînements",
    },
  ],
  "seniors-meneur": [
    {
      name: "Yanis B.",
      from: "Seniors 2",
      score: 90,
      note: "Équipe B, volume de jeu élevé",
    },
    {
      name: "Hugo T.",
      from: "U19 A",
      score: 81,
      note: "Prêt pour le niveau seniors",
    },
  ],
  "u18-att": [
    {
      name: "Inès D.",
      from: "U17 Filles",
      score: 88,
      note: "Équipe inférieure, déjà appelée 2×",
    },
    {
      name: "Sara L.",
      from: "Seniors Filles B",
      score: 75,
      note: "Retour de blessure, minutes à gérer",
    },
  ],
};

const EXTERNAL_HINTS = [
  {
    club: "AS Plateau",
    detail: "U15, 2 latéraux listés, 18 km",
  },
  {
    club: "FC Vallée",
    detail: "Seniors, milieux disponibles, même district",
  },
  {
    club: "Olympique Rive",
    detail: "U18 Filles, attaquantes, contact DS",
  },
];

const MOVES = [
  {
    player: "Yanis B.",
    from: "Seniors 2",
    to: "Seniors 1",
    status: "En attente validation club",
  },
  {
    player: "Léo M.",
    from: "U15 B",
    to: "U15 A",
    status: "Validé, intégration match",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Besoin déclaré",
    body: "Coach ou club : poste manquant, urgence, catégorie. Visible dans la bourse.",
  },
  {
    n: "02",
    title: "Vivier du club",
    body: "Matching sur les autres équipes : A et B, réserve, catégorie voisine. Avant le dehors.",
  },
  {
    n: "03",
    title: "Proposition",
    body: "Montée, prêt interne ou intégration. Le club valide ; le joueur (ou parent) est informé.",
  },
  {
    n: "04",
    title: "Puis l’extérieur",
    body: "Si le vivier ne suffit pas : publication entre clubs ProDay, puis Mercato.",
  },
] as const;

const COPY: Record<
  Audience,
  {
    kicker: string;
    title: string;
    support: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string;
    secondaryLabel: string;
  }
> = {
  club: {
    kicker: "Bourse de recrutement, Club et coach",
    title: "Il manque un joueur ? Cherchez d’abord dans vos équipes.",
    support:
      "Équipe B, réserve, catégorie voisine : la bourse scanne le vivier du club avant le Mercato. Dirigeants et DS voient les besoins, les correspondances et valident les mouvements.",
    primaryHref: ROUTES.betaWaitlist,
    primaryLabel: "Activer la bourse Club",
    secondaryHref: `${ROUTES.coach}#bourse`,
    secondaryLabel: "Vue coach",
  },
  coach: {
    kicker: "Effectif, Bourse de recrutement",
    title: "Besoin pour samedi ? Proposez une montée depuis l’équipe B.",
    support:
      "Déclarez le poste manquant : ProDay suggère des licenciés d’autres équipes du club (B, réserve, catégorie proche). Vous proposez ; le club valide. Ensuite seulement, recherche hors club.",
    primaryHref: ROUTES.betaWaitlist,
    primaryLabel: "Tester côté Coach",
    secondaryHref: `${ROUTES.proClub}#bourse`,
    secondaryLabel: "Vue Club et président",
  },
};

/**
 * Bourse vivier interne : besoins, équipes B / autres catégories, validation club.
 * Même module pour Pôle Club et Pôle Coach.
 */
export function RosterBourseSection({ audience }: { audience: Audience }) {
  const reduce = useReducedMotion();
  const copy = COPY[audience];
  const [scope, setScope] = useState<Scope>("internal");
  const [needId, setNeedId] = useState<(typeof NEEDS)[number]["id"]>("u15-lat");
  const matches = INTERNAL_MATCHES[needId] ?? [];
  const activeNeed = NEEDS.find((n) => n.id === needId) ?? NEEDS[0]!;

  return (
    <section
      id="bourse"
      className="relative overflow-hidden border-t border-white/10 bg-[#020617] px-4 py-16 sm:px-6 sm:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          background:
            audience === "coach"
              ? "radial-gradient(ellipse 55% 40% at 15% 0%, rgba(59,91,255,0.32), transparent 55%), radial-gradient(ellipse 40% 35% at 90% 70%, rgba(34,211,238,0.1), transparent 50%)"
              : "radial-gradient(ellipse 55% 40% at 80% 0%, rgba(0,84,240,0.32), transparent 55%), radial-gradient(ellipse 40% 35% at 10% 80%, rgba(251,191,36,0.1), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#006CFC)]">
          {copy.kicker}
        </p>
        <h2 className="mt-3 max-w-3xl font-display text-[clamp(1.75rem,4.2vw,3rem)] font-medium tracking-[-0.03em] text-white">
          {copy.title}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
          {copy.support}
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.article
              key={step.n}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--pole-accent,#006CFC)]">
                {step.n}
              </p>
              <h3 className="mt-2 font-display text-base font-medium text-white sm:text-lg">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{step.body}</p>
            </motion.article>
          ))}
        </div>

        {/* Démo interactive, même logique app : Dans mon club / Entre clubs / Propositions */}
        <div className="mt-12 border border-white/10 bg-black/40">
          <div className="flex flex-wrap gap-1 border-b border-white/10 p-2 sm:p-3">
            {(
              [
                { id: "internal" as const, label: "Dans mon club" },
                { id: "external" as const, label: "Entre clubs" },
                { id: "moves" as const, label: "Propositions" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScope(tab.id)}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
                  scope === tab.id
                    ? "bg-[var(--pole-accent,#006CFC)] text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="border-b border-white/10 p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                {audience === "coach" ? "Mes besoins d’équipe" : "Besoins du club"}
              </p>
              <ul className="mt-4 space-y-2">
                {NEEDS.map((need) => {
                  const on = need.id === needId;
                  return (
                    <li key={need.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setNeedId(need.id);
                          setScope("internal");
                        }}
                        className={`w-full border px-3.5 py-3 text-left transition ${
                          on
                            ? "border-[var(--pole-accent,#006CFC)]/50 bg-[var(--pole-accent,#006CFC)]/15"
                            : "border-white/10 bg-white/[0.02] hover:border-white/25"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-display text-base text-white">
                            {need.team}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-300/90">
                            Manque
                          </span>
                        </span>
                        <span className="mt-1 block text-sm text-white/80">
                          {need.post}
                        </span>
                        <span className="mt-1 block text-xs text-white/45">
                          {need.why}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-white/40">
                {audience === "coach"
                  ? "Le coach déclare le besoin depuis l’effectif. Le club voit la même bourse."
                  : "Le coach ou le bureau déclare. Dirigeants et DS valident les mouvements internes."}
              </p>
            </div>

            <div className="min-h-[280px] p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {scope === "internal" ? (
                  <motion.div
                    key={`int-${needId}`}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400/90">
                      Vivier interne, {activeNeed.team}
                    </p>
                    <h3 className="mt-2 font-display text-xl text-white">
                      Correspondances dans le club
                    </h3>
                    <p className="mt-1 text-sm text-white/50">
                      Équipe B, réserve, catégorie voisine. Score indicatif « Correspondance
                      ProDay », jamais une vérité absolue.
                    </p>
                    <ul className="mt-5 space-y-3">
                      {matches.map((m) => (
                        <li
                          key={m.name}
                          className="flex flex-wrap items-start justify-between gap-3 border border-white/10 bg-white/[0.03] px-3.5 py-3"
                        >
                          <div>
                            <p className="font-medium text-white">{m.name}</p>
                            <p className="mt-0.5 text-sm text-[var(--pole-accent-bright,#4C8BFF)]">
                              Depuis {m.from}
                            </p>
                            <p className="mt-1 text-xs text-white/45">{m.note}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-lg text-white">{m.score}</p>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                              Match
                            </p>
                            <button
                              type="button"
                              onClick={() => setScope("moves")}
                              className="mt-2 text-xs font-semibold text-white/70 underline-offset-2 hover:text-white hover:underline"
                            >
                              Proposer
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null}

                {scope === "external" ? (
                  <motion.div
                    key="ext"
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/90">
                      Entre clubs ProDay
                    </p>
                    <h3 className="mt-2 font-display text-xl text-white">
                      Après le vivier interne
                    </h3>
                    <p className="mt-1 text-sm text-white/50">
                      Publiez le besoin hors club seulement si aucune solution en interne.
                      Puis pipeline Mercato Observé puis Intégré.
                    </p>
                    <ul className="mt-5 space-y-3">
                      {EXTERNAL_HINTS.map((h) => (
                        <li
                          key={h.club}
                          className="border border-white/10 bg-white/[0.03] px-3.5 py-3"
                        >
                          <p className="font-medium text-white">{h.club}</p>
                          <p className="mt-1 text-sm text-white/55">{h.detail}</p>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null}

                {scope === "moves" ? (
                  <motion.div
                    key="moves"
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300/90">
                      Mouvements internes
                    </p>
                    <h3 className="mt-2 font-display text-xl text-white">
                      Propositions à valider
                    </h3>
                    <p className="mt-1 text-sm text-white/50">
                      {audience === "coach"
                        ? "Vous proposez la montée ; le club (DS ou bureau) confirme avant intégration."
                        : "Le coach propose ; vous validez le passage équipe B vers A (ou autre)."}
                    </p>
                    <ul className="mt-5 space-y-3">
                      {MOVES.map((m) => (
                        <li
                          key={m.player}
                          className="border border-white/10 bg-white/[0.03] px-3.5 py-3"
                        >
                          <p className="font-medium text-white">{m.player}</p>
                          <p className="mt-1 text-sm text-white/70">
                            {m.from} vers {m.to}
                          </p>
                          <p className="mt-1 text-xs text-white/45">{m.status}</p>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={copy.primaryHref}
            className="inline-flex items-center justify-center bg-[var(--pole-accent,#006CFC)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {copy.primaryLabel}
          </Link>
          <Link
            href={copy.secondaryHref}
            className="inline-flex items-center justify-center border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            {copy.secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
