"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { PlayerAppPhone } from "@/components/poles/PlayerAppPhone";
import { ROUTES } from "@/lib/routes";

const JOUEUR_SIGNALS = [
  {
    tone: "play" as const,
    label: "Sur le terrain",
    body: "Convocations, calendrier match et préparation au même endroit.",
  },
  {
    tone: "stats" as const,
    label: "Progression",
    body: "Stats de saison, anneaux de forme et objectifs mesurables.",
  },
  {
    tone: "id" as const,
    label: "Identité",
    body: "Carte joueur, profil et modules ProDay sous la main.",
  },
];

const APP_BEATS = [
  {
    title: "Accueil · Parcours",
    body: "Bonjour, carte profil, objectifs et anneaux de stats — ta journée foot en un coup d’œil.",
  },
  {
    title: "Centre Match",
    body: "Calendrier, carte du lieu, infos match. Moins de friction avant le coup d’envoi.",
  },
  {
    title: "Saison",
    body: "Minutes, tendances, progression. Les données suivent le terrain, pas l’inverse.",
  },
  {
    title: "Profil & Plus",
    body: "Compte, performance, et tous les modules ProDay depuis le menu Plus.",
  },
];

/**
 * Vitrine app Joueur — ancrée sur /joueur#app (un téléphone, pas cinq cartes).
 */
export function JoueurAppHub() {
  const reduce = useReducedMotion();

  return (
    <section
      id="app"
      className="relative scroll-mt-28 overflow-hidden border-t border-white/10 bg-[#020814] px-4 py-16 sm:px-6 sm:py-24"
      style={
        {
          "--pole-accent": "#1E3AFF",
          "--pole-accent-bright": "#EF4444",
        } as CSSProperties
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 0%, rgba(30, 58, 255, 0.32), transparent 55%), radial-gradient(ellipse 45% 40% at 95% 85%, rgba(239, 68, 68, 0.14), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#1E3AFF)]">
              Pôle Joueur · L’app
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.75rem,4.2vw,3rem)] font-medium tracking-[-0.03em] text-white">
              Le joueur ouvre ProDay et voit son parcours, pas un tableau de bord.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              Accueil, matchs, saison, profil : une composition, un téléphone. Accent bleu
              et rouge — le langage du Pôle Joueur.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {JOUEUR_SIGNALS.map((s, i) => (
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
                      s.tone === "play"
                        ? "text-[#1E3AFF]"
                        : s.tone === "stats"
                          ? "text-emerald-400"
                          : "text-[var(--pole-accent-bright,#EF4444)]"
                    }`}
                  >
                    ● {s.label}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{s.body}</p>
                </motion.article>
              ))}
            </div>
          </div>

          <PlayerAppPhone className="mx-auto w-full lg:sticky lg:top-28" />
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <h3 className="font-display text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl">
              Cinq onglets. Une seule app.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Captures réelles du Pôle Joueur. Pass optionnel 3,99 € pour programmes,
              vidéo et contenu avancé.
            </p>
            <ul className="mt-6 space-y-5">
              {APP_BEATS.map((b) => (
                <li
                  key={b.title}
                  className="border-l-2 border-[var(--pole-accent,#1E3AFF)] pl-4"
                >
                  <p className="text-sm font-semibold text-white">{b.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/50">{b.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-end gap-6 border border-white/10 bg-gradient-to-br from-[#1E3AFF]/25 via-[#020814] to-[#7F1D1D]/40 p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Qui est sur le Pôle Joueur ?
            </p>
            <p className="font-display text-2xl font-medium tracking-[-0.02em] text-white">
              Joueurs · Joueuses · Jeunes · Ados · Adultes
            </p>
            <p className="text-sm leading-relaxed text-white/55">
              Choisis ton profil plus haut, puis ouvre l’univers adapté. Parents et coachs
              ont leur pôle dédié.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={ROUTES.betaWaitlist}
                className="inline-flex items-center justify-center bg-[var(--pole-accent,#1E3AFF)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Rejoindre la bêta Joueur
              </Link>
              <Link
                href={ROUTES.joueur}
                className="inline-flex items-center justify-center border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50"
              >
                Qui es tu ?
              </Link>
              <Link
                href={`${ROUTES.pricing}#joueur`}
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
