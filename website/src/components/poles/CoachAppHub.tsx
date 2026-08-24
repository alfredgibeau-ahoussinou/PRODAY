"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { CoachAppPhone } from "@/components/poles/CoachAppPhone";
import { ROUTES } from "@/lib/routes";

const COACH_SIGNALS = [
  {
    tone: "plan" as const,
    label: "Calendrier",
    body: "Matchs, séances et planning — le jour J avec pointage et convocations.",
  },
  {
    tone: "squad" as const,
    label: "Effectif",
    body: "Composition sur le terrain, liste joueurs et forme déclarée.",
  },
  {
    tone: "ia" as const,
    label: "Assistant IA",
    body: "Préparation, consignes et questions métier depuis le banc.",
  },
];

const APP_BEATS = [
  {
    title: "Accueil · Calendrier",
    body: "Rien de prévu ? Créez match ou entraînement. Le planning s’affiche ici.",
  },
  {
    title: "Équipe · Effectif",
    body: "Tableau tactique 4-2-3-1, banc et consignes — composition visuelle.",
  },
  {
    title: "Joueurs",
    body: "Effectif en liste : postes, disponibilité, suivi avant le weekend.",
  },
  {
    title: "IA · Menu · Profil",
    body: "Assistant, modules ProDay et identité coach — diplômes et parcours.",
  },
];

/**
 * Vitrine app Coach — ancrée sur /coach#app (un téléphone, pas six cartes).
 */
export function CoachAppHub() {
  const reduce = useReducedMotion();

  return (
    <section
      id="app"
      className="relative scroll-mt-28 overflow-hidden border-t border-white/10 bg-[#020814] px-4 py-16 sm:px-6 sm:py-24"
      style={
        {
          "--pole-accent": "#2563EB",
          "--pole-accent-bright": "#E8B923",
        } as CSSProperties
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 0%, rgba(37, 99, 235, 0.32), transparent 55%), radial-gradient(ellipse 45% 40% at 95% 85%, rgba(232, 185, 35, 0.12), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#2563EB)]">
              Pôle Coach · L’app
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.75rem,4.2vw,3rem)] font-medium tracking-[-0.03em] text-white">
              Le coach ouvre ProDay et voit son banc, pas un tableur.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              Accueil, équipe, joueurs, IA, menu, profil : une composition, un téléphone.
              Accent bleu — le langage de l’app Coach.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {COACH_SIGNALS.map((s, i) => (
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
                      s.tone === "plan"
                        ? "text-[#2563EB]"
                        : s.tone === "squad"
                          ? "text-emerald-400"
                          : "text-[var(--pole-accent-bright,#E8B923)]"
                    }`}
                  >
                    ● {s.label}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{s.body}</p>
                </motion.article>
              ))}
            </div>
          </div>

          <CoachAppPhone className="mx-auto w-full lg:sticky lg:top-28" />
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <h3 className="font-display text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl">
              Six écrans. Une seule app.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Captures réelles du Pôle Coach (Seniors A). Sous Tout inclus, le club
              couvre les coachs.
            </p>
            <ul className="mt-6 space-y-5">
              {APP_BEATS.map((b) => (
                <li
                  key={b.title}
                  className="border-l-2 border-[var(--pole-accent,#2563EB)] pl-4"
                >
                  <p className="text-sm font-semibold text-white">{b.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/50">{b.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-end gap-6 border border-white/10 bg-gradient-to-br from-[#2563EB]/30 via-[#020814] to-[#92700C]/35 p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Qui est sur le Pôle Coach ?
            </p>
            <p className="font-display text-2xl font-medium tracking-[-0.02em] text-white">
              Coachs · Staff · Éducateurs · Préparateurs
            </p>
            <p className="text-sm leading-relaxed text-white/55">
              Effectif, tactique et assistant IA dans la même app que vos licenciés.
              Dirigeants et parents ont leur pôle dédié.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={ROUTES.betaWaitlist}
                className="inline-flex items-center justify-center bg-[var(--pole-accent,#2563EB)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Rejoindre la bêta Coach
              </Link>
              <Link
                href="#analyse-de-forme"
                className="inline-flex items-center justify-center border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50"
              >
                Analyse de forme
              </Link>
              <Link
                href={`${ROUTES.pricing}#coach`}
                className="inline-flex items-center justify-center border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
