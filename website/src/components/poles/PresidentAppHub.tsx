"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { ExecutiveAppPhone } from "@/components/poles/ExecutiveAppPhone";
import { COACH_APP_HREF, CLUB_APP_HREF, ROUTES } from "@/lib/routes";

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

const APP_BEATS = [
  {
    title: "Cockpit",
    body: "Le club en un coup d’œil : équipes, alertes et décisions à prendre · pas quinze menus.",
  },
  {
    title: "Club · Finances",
    body: "Structure, effectifs, budget, adhésions et sponsors sous le même QG.",
  },
  {
    title: "Menu · Assistant IA",
    body: "Tous les modules dirigeants à portée de main, avec l’IA pour prioriser.",
  },
];

/**
 * Vitrine app Président — ancrée sur /president#app (un téléphone, pas une section Club).
 */
export function PresidentAppHub() {
  const reduce = useReducedMotion();

  return (
    <section
      id="app"
      className="relative scroll-mt-28 overflow-hidden border-t border-white/10 bg-[#0c0a04] px-4 py-16 sm:px-6 sm:py-24"
      style={
        {
          "--pole-accent": "#E8B923",
          "--pole-accent-bright": "#F5D04A",
        } as CSSProperties
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 0%, rgba(232, 185, 35, 0.28), transparent 55%), radial-gradient(ellipse 45% 40% at 95% 85%, rgba(245, 208, 74, 0.12), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#E8B923)]">
              Pôle Président · L’app
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.75rem,4.2vw,3rem)] font-medium tracking-[-0.03em] text-white">
              Le président ouvre ProDay et comprend le club en quelques secondes.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              Dirigeants, DS et secrétariat pilotent depuis le Pôle Président. Le coach
              prépare ; le président décide. Or · le langage de l’app Executive.
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
              Cinq écrans. Une seule app.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Captures réelles du Pôle Président. Cockpit, club, finances, menu et
              assistant IA. Parrainage possible · partagez votre lien ou votre code.
            </p>
            <ul className="mt-6 space-y-5">
              {APP_BEATS.map((b) => (
                <li
                  key={b.title}
                  className="border-l-2 border-[var(--pole-accent,#E8B923)] pl-4"
                >
                  <p className="text-sm font-semibold text-white">{b.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/50">{b.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-end gap-6 border border-white/10 bg-gradient-to-br from-[#E8B923]/28 via-[#0c0a04] to-[#B8941F]/35 p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Qui est sur le Pôle Président ?
            </p>
            <p className="font-display text-2xl font-medium tracking-[-0.02em] text-white">
              Présidents · DS · Secrétariat · Bureau
            </p>
            <p className="text-sm leading-relaxed text-white/55">
              Le Club structure les équipes et les licences. Les coachs ont leur pôle
              dédié. Ici, on décide.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={ROUTES.betaWaitlist}
                className="inline-flex items-center justify-center bg-[var(--pole-accent,#E8B923)] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Rejoindre la bêta
              </Link>
              <Link
                href={CLUB_APP_HREF}
                className="inline-flex items-center justify-center border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50"
              >
                Voir le Pôle Club
              </Link>
              <Link
                href={COACH_APP_HREF}
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
