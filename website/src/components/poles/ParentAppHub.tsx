"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { ParentAppPhone } from "@/components/poles/ParentAppPhone";
import { ROUTES } from "@/lib/routes";

const PARENT_SIGNALS = [
  {
    tone: "home" as const,
    label: "Famille",
    body: "Accueil parent · lier un enfant, puis matchs, trajets et messages au même endroit.",
  },
  {
    tone: "guide" as const,
    label: "Guide IA",
    body: "Suggestions pour accompagner sans étouffer : cadre, contacts, agenda.",
  },
  {
    tone: "tools" as const,
    label: "Outils",
    body: "Menu famille et profil · réglages, lier un enfant, déconnexion.",
  },
];

const APP_BEATS = [
  {
    title: "Accueil",
    body: "Aucun enfant lié ? Le lien se fait ici. Ensuite, le parcours du mineur tient dans un écran.",
  },
  {
    title: "Guide",
    body: "Suggestions IA : quoi dire, quand relancer, comment rester présent sans envahir.",
  },
  {
    title: "Menu",
    body: "Outils famille : supervision, contacts approuvés, agenda et raccourcis du pôle.",
  },
  {
    title: "Profil",
    body: "Réglages, lier un enfant, notifications et déconnexion · le cadre, pas cinq apps.",
  },
];

/**
 * Vitrine app Parent — ancrée sur /parent#app (un téléphone, pas quatre cartes).
 */
export function ParentAppHub() {
  const reduce = useReducedMotion();

  return (
    <section
      id="app"
      className="relative scroll-mt-28 overflow-hidden border-t border-white/10 bg-[#140a04] px-4 py-16 sm:px-6 sm:py-24"
      style={
        {
          "--pole-accent": "#F97316",
          "--pole-accent-bright": "#84CC16",
        } as CSSProperties
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 0%, rgba(249, 115, 22, 0.28), transparent 55%), radial-gradient(ellipse 45% 40% at 95% 85%, rgba(132, 204, 22, 0.14), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#F97316)]">
              Pôle Parent · L’app
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.75rem,4.2vw,3rem)] font-medium tracking-[-0.03em] text-white">
              Le parent ouvre ProDay et voit le cadre, pas un fil WhatsApp.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              Accueil, Guide, Menu, Profil : une composition, un téléphone. Orange et
              lime · le langage de l’app Parent.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {PARENT_SIGNALS.map((s, i) => (
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
                        ? "text-[#F97316]"
                        : s.tone === "guide"
                          ? "text-[#84CC16]"
                          : "text-[var(--pole-accent-bright,#84CC16)]"
                    }`}
                  >
                    ● {s.label}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{s.body}</p>
                </motion.article>
              ))}
            </div>
          </div>

          <ParentAppPhone className="mx-auto w-full lg:sticky lg:top-28" />
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <h3 className="font-display text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl">
              Quatre écrans. Une seule app.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Captures réelles du Pôle Parent. Espace gratuit, lié au compte joueur de
              l’enfant. Parrainage possible · partagez votre lien ou votre code.
            </p>
            <ul className="mt-6 space-y-5">
              {APP_BEATS.map((b) => (
                <li
                  key={b.title}
                  className="border-l-2 border-[var(--pole-accent,#F97316)] pl-4"
                >
                  <p className="text-sm font-semibold text-white">{b.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/50">{b.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-end gap-6 border border-white/10 bg-gradient-to-br from-[#F97316]/28 via-[#140a04] to-[#365314]/40 p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Qui est sur le Pôle Parent ?
            </p>
            <p className="font-display text-2xl font-medium tracking-[-0.02em] text-white">
              Parents · Tuteurs · Familles
            </p>
            <p className="text-sm leading-relaxed text-white/55">
              Supervision, contacts approuvés et limites de temps · dans la même app que
              l’enfant. Joueurs et coachs ont leur pôle dédié.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={ROUTES.betaWaitlist}
                className="inline-flex items-center justify-center bg-[var(--pole-accent,#F97316)] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Rejoindre la bêta Parent
              </Link>
              <Link
                href={ROUTES.trust}
                className="inline-flex items-center justify-center border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50"
              >
                Pôle Confiance
              </Link>
              <Link
                href={`${ROUTES.pricing}#parent`}
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
