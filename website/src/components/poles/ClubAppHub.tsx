"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { ClubAppPhone } from "@/components/poles/ClubAppPhone";
import { COACH_APP_HREF, PRESIDENT_HUB_HREF, ROUTES } from "@/lib/routes";

const CLUB_SIGNALS = [
  {
    tone: "home" as const,
    label: "Priorité",
    body: "Accueil club — priorité du jour, équipes et actions urgentes au même endroit.",
  },
  {
    tone: "ops" as const,
    label: "Terrain",
    body: "Équipes, matchs et invitations — du roster au calendrier inter-clubs.",
  },
  {
    tone: "hq" as const,
    label: "QG",
    body: "Outils, identité, pack et lien Président — le cockpit structure.",
  },
];

const APP_BEATS = [
  {
    title: "Accueil",
    body: "Priorité du jour, effectifs et équipes — le club en une ouverture.",
  },
  {
    title: "Équipes · Matchs",
    body: "Catégories, licenciés, calendrier et invitations entre structures.",
  },
  {
    title: "Outils",
    body: "Modules opérationnels et raccourci vers le Pôle Président.",
  },
  {
    title: "Club",
    body: "Identité, pack, droits, finances et couleurs — la vitrine de la structure.",
  },
];

/**
 * Vitrine app Club — ancrée sur /pro-club#app (un téléphone, pas une grille de cartes).
 */
export function ClubAppHub() {
  const reduce = useReducedMotion();

  return (
    <section
      id="app"
      className="relative scroll-mt-28 overflow-hidden border-t border-white/10 bg-[#020617] px-4 py-16 sm:px-6 sm:py-24"
      style={
        {
          "--pole-accent": "#2563EB",
          "--pole-accent-bright": "#10B981",
        } as CSSProperties
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 0%, rgba(37, 99, 235, 0.32), transparent 55%), radial-gradient(ellipse 45% 40% at 95% 85%, rgba(16, 185, 129, 0.14), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#2563EB)]">
              Pôle Club · L’app
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.75rem,4.2vw,3rem)] font-medium tracking-[-0.03em] text-white">
              Le club ouvre ProDay et voit la structure, pas un tableur.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              Accueil, équipes, matchs, outils, identité : une composition, un téléphone.
              Bleu et émeraude — le langage de l’app Club.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {CLUB_SIGNALS.map((s, i) => (
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
                      s.tone === "home"
                        ? "text-[#2563EB]"
                        : s.tone === "ops"
                          ? "text-[#10B981]"
                          : "text-[var(--pole-accent-bright,#10B981)]"
                    }`}
                  >
                    ● {s.label}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{s.body}</p>
                </motion.article>
              ))}
            </div>
          </div>

          <ClubAppPhone className="mx-auto w-full lg:sticky lg:top-28" />
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <h3 className="font-display text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl">
              Cinq écrans. Une seule app.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Captures réelles du Pôle Club. À partir de 3 € / adhérent sur devis.
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

          <div className="flex flex-col justify-end gap-6 border border-white/10 bg-gradient-to-br from-[#2563EB]/28 via-[#020617] to-[#064E3B]/40 p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Qui est sur le Pôle Club ?
            </p>
            <p className="font-display text-2xl font-medium tracking-[-0.02em] text-white">
              Clubs · Staff · Organisateurs
            </p>
            <p className="text-sm leading-relaxed text-white/55">
              Équipes, matchs, pack et identité — dans la même app que les licenciés.
              Président et coachs ont leur pôle dédié.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={ROUTES.betaWaitlist}
                className="inline-flex items-center justify-center bg-[var(--pole-accent,#2563EB)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Rejoindre la bêta Club
              </Link>
              <Link
                href={PRESIDENT_HUB_HREF}
                className="inline-flex items-center justify-center border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50"
              >
                Pôle Président
              </Link>
              <Link
                href={COACH_APP_HREF}
                className="inline-flex items-center justify-center border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50"
              >
                Pôle Coach
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
