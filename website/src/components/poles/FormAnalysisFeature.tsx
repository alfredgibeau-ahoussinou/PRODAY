"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { AnimatedMetric } from "@/components/immersive/AnimatedMetric";
import { ROUTES } from "@/lib/routes";

type Audience = "all" | "coach" | "joueur" | "club";
type FormBand = "optimal" | "watch" | "low";
type ViewMode = "effectif" | "match";

type PlayerRow = {
  name: string;
  team: string;
  score: number;
  band: FormBand;
  charge: string;
  recovery: string;
  availability: string;
  insight: string;
};

const TEAMS = [
  { id: "seniors", label: "Seniors 1" },
  { id: "u18", label: "U18" },
  { id: "u15", label: "U15 A" },
] as const;

type TeamId = (typeof TEAMS)[number]["id"];

const SQUAD: Record<TeamId, PlayerRow[]> = {
  seniors: [
    {
      name: "Karim B.",
      team: "Seniors 1",
      score: 88,
      band: "optimal",
      charge: "modérée",
      recovery: "bonne",
      availability: "Disponible",
      insight: "Bonne dynamique — minutes stables, récupération déclarée solide.",
    },
    {
      name: "Noah L.",
      team: "Seniors 1",
      score: 64,
      band: "watch",
      charge: "élevée",
      recovery: "moyenne",
      availability: "À surveiller",
      insight: "Charge haute sur 7 jours — alléger la densification avant le match.",
    },
    {
      name: "Ethan R.",
      team: "Seniors 1",
      score: 47,
      band: "low",
      charge: "très élevée",
      recovery: "faible",
      availability: "Repos conseillé",
      insight: "Repos / adaptation de séance recommandée — ne pas forcer le volume.",
    },
    {
      name: "Yanis M.",
      team: "Seniors 1",
      score: 81,
      band: "optimal",
      charge: "faible",
      recovery: "bonne",
      availability: "Disponible",
      insight: "Disponible et frais — profil prioritaire pour le onze.",
    },
  ],
  u18: [
    {
      name: "Léo D.",
      team: "U18",
      score: 79,
      band: "optimal",
      charge: "modérée",
      recovery: "bonne",
      availability: "Disponible",
      insight: "Présences régulières — forme stable pour le week-end.",
    },
    {
      name: "Amine K.",
      team: "U18",
      score: 58,
      band: "watch",
      charge: "élevée",
      recovery: "moyenne",
      availability: "À surveiller",
      insight: "Double séance + match midweek — surveiller la récupération déclarée.",
    },
    {
      name: "Hugo T.",
      team: "U18",
      score: 72,
      band: "watch",
      charge: "modérée",
      recovery: "moyenne",
      availability: "À surveiller",
      insight: "Retour progressif — minutes à doser en première période.",
    },
  ],
  u15: [
    {
      name: "Noa R.",
      team: "U15 A",
      score: 91,
      band: "optimal",
      charge: "faible",
      recovery: "bonne",
      availability: "Disponible",
      insight: "Excellente fraîcheur — prêt pour un volume de jeu normal.",
    },
    {
      name: "Inès P.",
      team: "U15 A",
      score: 52,
      band: "low",
      charge: "élevée",
      recovery: "faible",
      availability: "Repos conseillé",
      insight: "Fatigue déclarée élevée — privilégier récupération active.",
    },
    {
      name: "Sara M.",
      team: "U15 A",
      score: 76,
      band: "optimal",
      charge: "modérée",
      recovery: "bonne",
      availability: "Disponible",
      insight: "Indicateurs cohérents — aucune alerte de charge.",
    },
  ],
};

const BAND_META: Record<
  FormBand,
  { label: string; tone: string; bar: string }
> = {
  optimal: {
    label: "Forme optimale",
    tone: "text-emerald-400",
    bar: "bg-emerald-400",
  },
  watch: {
    label: "À surveiller",
    tone: "text-amber-400",
    bar: "bg-amber-400",
  },
  low: {
    label: "Forme faible",
    tone: "text-rose-400",
    bar: "bg-rose-400",
  },
};

const COPY: Record<
  Audience,
  {
    kicker: string;
    title: string;
    support: string;
    boardKicker: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref?: string;
    secondaryLabel?: string;
  }
> = {
  club: {
    kicker: "Fonctionnalité centrale · Inclus dans l’offre Club",
    title: "L’état de forme de tout le club, équipe par équipe.",
    support:
      "Dirigeants et DS voient la disponibilité réelle avant le week-end. Les coachs agissent sur la charge et la récupération déclarée — jamais un diagnostic médical.",
    boardKicker: "Tableau effectif · Vue Club",
    primaryHref: ROUTES.betaWaitlist,
    primaryLabel: "Activer pour mon club",
    secondaryHref: `${ROUTES.coach}#analyse-de-forme`,
    secondaryLabel: "Vue Coach",
  },
  coach: {
    kicker: "Fonctionnalité centrale · Effectif",
    title: "Composez avec la forme réelle de votre banc.",
    support:
      "Charge, récupération déclarée, disponibilité et alertes avant match. Adaptez la séance — pas un avis médical.",
    boardKicker: "Tableau effectif · Vue Coach",
    primaryHref: ROUTES.betaWaitlist,
    primaryLabel: "Tester côté Coach",
    secondaryHref: `${ROUTES.proClub}#analyse-de-forme`,
    secondaryLabel: "Vue Club",
  },
  joueur: {
    kicker: "Fonctionnalité centrale · Ma forme",
    title: "Comprenez votre récupération. Progressez mieux.",
    support:
      "Suivi personnel de charge et de récupération déclarée. Votre coach voit l’effectif ; vous voyez votre trajectoire.",
    boardKicker: "Aperçu effectif · ce que voit le staff",
    primaryHref: ROUTES.joueur,
    primaryLabel: "Découvrir le Pôle Joueur",
    secondaryHref: `${ROUTES.coach}#analyse-de-forme`,
    secondaryLabel: "Côté Coach",
  },
  all: {
    kicker: "Fonctionnalité centrale ProDay",
    title: "Analyse de forme : du club au joueur.",
    support:
      "Vision effectif pour le coach et le club. Suivi personnel pour chaque licencié. Indicateurs de charge — jamais un diagnostic.",
    boardKicker: "Tableau effectif · Démo",
    primaryHref: ROUTES.coach,
    primaryLabel: "Voir côté Coach",
    secondaryHref: ROUTES.joueur,
    secondaryLabel: "Voir côté Joueur",
  },
};

const FLOW = [
  {
    n: "01",
    title: "Signaux",
    body: "Présences, minutes, check-ins, fatigue et récupération déclarées.",
  },
  {
    n: "02",
    title: "Lecture",
    body: "Chaque joueur reçoit une bande : optimale, à surveiller, ou faible.",
  },
  {
    n: "03",
    title: "Décision",
    body: "Avant match : insights de prudence et adaptation de séance.",
  },
] as const;

function summarize(rows: PlayerRow[]) {
  return {
    optimal: rows.filter((r) => r.band === "optimal").length,
    watch: rows.filter((r) => r.band === "watch").length,
    low: rows.filter((r) => r.band === "low").length,
  };
}

/**
 * Bloc produit — Analyse de forme (fonctionnalité centrale).
 * Coach = effectif · Joueur = suivi personnel · Club = inclus dans l’offre.
 */
export function FormAnalysisFeature({
  audience = "all",
}: {
  audience?: Audience;
}) {
  const reduce = useReducedMotion();
  const copy = COPY[audience];
  const [teamId, setTeamId] = useState<TeamId>("seniors");
  const [view, setView] = useState<ViewMode>("effectif");
  const [selected, setSelected] = useState<string | null>(null);

  const rows = SQUAD[teamId];
  const summary = summarize(rows);
  const active =
    rows.find((r) => r.name === selected) ??
    rows.find((r) => r.band !== "optimal") ??
    rows[0]!;

  return (
    <section
      id="analyse-de-forme"
      className="relative overflow-hidden border-t border-white/10 bg-[#020814] px-4 py-16 sm:px-6 sm:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          background:
            audience === "coach"
              ? "radial-gradient(ellipse 55% 42% at 18% 0%, rgba(59,91,255,0.3), transparent 55%), radial-gradient(ellipse 40% 35% at 92% 75%, rgba(34,211,238,0.08), transparent 50%)"
              : "radial-gradient(ellipse 60% 45% at 82% 8%, rgba(0,108,252,0.3), transparent 55%), radial-gradient(ellipse 42% 36% at 8% 85%, rgba(16,185,129,0.1), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#7C3AED)]">
          {copy.kicker}
        </p>
        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
          className="mt-3 max-w-3xl font-display text-[clamp(1.75rem,4.2vw,3rem)] font-medium tracking-[-0.03em] text-white"
        >
          {copy.title}
        </motion.h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
          {copy.support}
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {FLOW.map((step, i) => (
            <motion.article
              key={step.n}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--pole-accent,#7C3AED)]">
                {step.n}
              </p>
              <h3 className="mt-2 font-display text-base font-medium text-white sm:text-lg">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {step.body}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Démo interactive — même logique app : effectif + avant match */}
        <div className="mt-12 border border-white/10 bg-black/45">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              {copy.boardKicker}
            </p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: "effectif" as const, label: "État de l’effectif" },
                  { id: "match" as const, label: "Avant match" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setView(tab.id)}
                  className={`px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
                    view === tab.id
                      ? "bg-[var(--pole-accent,#7C3AED)] text-white"
                      : "text-white/55 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-white/10 p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Équipes du club
              </p>
              <ul className="mt-4 space-y-2">
                {TEAMS.map((team) => {
                  const on = team.id === teamId;
                  const teamSummary = summarize(SQUAD[team.id]);
                  return (
                    <li key={team.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setTeamId(team.id);
                          setSelected(null);
                        }}
                        className={`w-full border px-3.5 py-3 text-left transition ${
                          on
                            ? "border-[var(--pole-accent,#7C3AED)]/50 bg-[var(--pole-accent,#7C3AED)]/15"
                            : "border-white/10 bg-white/[0.02] hover:border-white/25"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-display text-base text-white">
                            {team.label}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                            {SQUAD[team.id].length} joueurs
                          </span>
                        </span>
                        <span className="mt-2 flex flex-wrap gap-3 text-xs">
                          <span className="text-emerald-400">
                            {teamSummary.optimal} optimale
                          </span>
                          <span className="text-amber-400">
                            {teamSummary.watch} à surveiller
                          </span>
                          <span className="text-rose-400">
                            {teamSummary.low} faible
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
                {(
                  [
                    {
                      key: "optimal" as const,
                      label: "Optimale",
                      value: String(summary.optimal),
                      className: "text-emerald-400",
                    },
                    {
                      key: "watch" as const,
                      label: "Surveillance",
                      value: String(summary.watch),
                      className: "text-amber-400",
                    },
                    {
                      key: "low" as const,
                      label: "Faible",
                      value: String(summary.low),
                      className: "text-rose-400",
                    },
                  ] as const
                ).map((kpi) => (
                  <div key={kpi.key}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                      {kpi.label}
                    </p>
                    <AnimatedMetric
                      value={kpi.value}
                      className={`mt-1 font-display text-3xl font-medium ${kpi.className}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-[320px] p-4 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${teamId}-${view}`}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  {view === "effectif" ? (
                    <>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                        Joueur · Forme · Charge · Récup. · Dispo.
                      </p>
                      <h3 className="mt-2 font-display text-xl text-white">
                        État de forme —{" "}
                        {TEAMS.find((t) => t.id === teamId)?.label}
                      </h3>
                      <p className="mt-1 text-sm text-white/50">
                        Indicateurs opérationnels. Touchez un joueur pour le détail.
                      </p>

                      <ul className="mt-5 space-y-2">
                        {rows.map((row) => {
                          const meta = BAND_META[row.band];
                          const on = active.name === row.name;
                          return (
                            <li key={row.name}>
                              <button
                                type="button"
                                onClick={() => setSelected(row.name)}
                                className={`w-full border px-3 py-3 text-left transition sm:px-3.5 ${
                                  on
                                    ? "border-white/25 bg-white/[0.06]"
                                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                                }`}
                              >
                                <span className="flex items-center gap-3">
                                  <span
                                    aria-hidden
                                    className={`h-8 w-1 shrink-0 ${meta.bar}`}
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                                      <span className="font-medium text-white">
                                        {row.name}
                                      </span>
                                      <span className="font-mono text-sm text-white">
                                        {row.score}
                                      </span>
                                    </span>
                                    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/45">
                                      <span className={meta.tone}>
                                        {meta.label}
                                      </span>
                                      <span>Charge {row.charge}</span>
                                      <span>Récup. {row.recovery}</span>
                                      <span>{row.availability}</span>
                                    </span>
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400/90">
                        Analyse avant match
                      </p>
                      <h3 className="mt-2 font-display text-xl text-white">
                        Insights de prudence
                      </h3>
                      <p className="mt-1 text-sm text-white/50">
                        Croisement présences, minutes, charge récente et récupération
                        déclarée. Formulations de prudence uniquement.
                      </p>

                      <ul className="mt-5 space-y-3">
                        {rows
                          .filter((r) => r.band !== "optimal")
                          .map((row) => {
                            const meta = BAND_META[row.band];
                            return (
                              <li
                                key={row.name}
                                className="border border-white/10 bg-white/[0.03] px-3.5 py-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium text-white">
                                    {row.name}
                                  </p>
                                  <p
                                    className={`font-mono text-[10px] uppercase tracking-[0.14em] ${meta.tone}`}
                                  >
                                    {meta.label}
                                  </p>
                                </div>
                                <p className="mt-2 text-sm leading-relaxed text-white/60">
                                  {row.insight}
                                </p>
                              </li>
                            );
                          })}
                      </ul>

                      {rows.every((r) => r.band === "optimal") ? (
                        <p className="mt-5 text-sm text-white/50">
                          Aucune alerte sur cet effectif pour le prochain match.
                        </p>
                      ) : (
                        <p className="mt-5 text-sm text-[var(--pole-accent-bright,#5B75FF)]">
                          Adapter les entraînements selon la charge →
                        </p>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {view === "effectif" && active ? (
                <motion.div
                  key={active.name}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-5 border-t border-white/10 pt-4"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    Détail · {active.name}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">
                    {active.insight}
                  </p>
                </motion.div>
              ) : null}
            </div>
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-white/40 sm:text-sm">
          Indicateurs de charge et récupération déclarée — jamais un diagnostic
          médical, ni un pourcentage de risque de blessure.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={copy.primaryHref}
            className="inline-flex bg-[var(--pole-accent,#7C3AED)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {copy.primaryLabel}
          </Link>
          {copy.secondaryHref && copy.secondaryLabel ? (
            <Link
              href={copy.secondaryHref}
              className="inline-flex border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
            >
              {copy.secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
