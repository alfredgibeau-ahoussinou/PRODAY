"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { SponsorAppPhone } from "@/components/poles/SponsorAppPhone";
import { ROUTES } from "@/lib/routes";

const SPONSOR_SIGNALS = [
  {
    tone: "kpi" as const,
    label: "Dashboard",
    body: "Accueil sponsor — validation, offres, clubs touchés et conversion au même endroit.",
  },
  {
    tone: "pipeline" as const,
    label: "Pipeline",
    body: "Offres, financement, prospects et messages — du pack à la conversation.",
  },
  {
    tone: "brand" as const,
    label: "Marque",
    body: "Formules, contacts et profil — vitrine mesurée sans intermédiaire.",
  },
];

const APP_BEATS = [
  {
    title: "Accueil",
    body: "Espace en validation ? Préparez offres et prospects. KPIs et performance marque en un coup d’œil.",
  },
  {
    title: "Offres · Financement",
    body: "Publiez une campagne, suivez les contributions et le soutien aux clubs.",
  },
  {
    title: "Formules · Messages",
    body: "Packs Découverte à National Pro, puis messagerie directe avec les structures.",
  },
  {
    title: "Prospects · Contacts · Marque",
    body: "Clubs recommandés, réseau interlocuteurs et profil marque — le même parcours.",
  },
];

/**
 * Vitrine app Sponsor — ancrée sur /sponsor#app (un téléphone, pas huit cartes).
 */
export function SponsorAppHub() {
  const reduce = useReducedMotion();

  return (
    <section
      id="app"
      className="relative scroll-mt-28 overflow-hidden border-t border-white/10 bg-[#12010f] px-4 py-16 sm:px-6 sm:py-24"
      style={
        {
          "--pole-accent": "#C026D3",
          "--pole-accent-bright": "#E879F9",
        } as CSSProperties
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 0%, rgba(192, 38, 211, 0.32), transparent 55%), radial-gradient(ellipse 45% 40% at 95% 85%, rgba(232, 121, 249, 0.14), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#C026D3)]">
              Pôle Sponsor · L’app
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.75rem,4.2vw,3rem)] font-medium tracking-[-0.03em] text-white">
              La marque ouvre ProDay et voit le ROI, pas un PDF.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              Accueil, offres, financement, formules, messages, prospects, contacts,
              marque : une composition, un téléphone. Magenta — le langage de l’app
              Sponsor.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {SPONSOR_SIGNALS.map((s, i) => (
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
                      s.tone === "kpi"
                        ? "text-[#C026D3]"
                        : s.tone === "pipeline"
                          ? "text-[#E879F9]"
                          : "text-[var(--pole-accent-bright,#E879F9)]"
                    }`}
                  >
                    ● {s.label}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{s.body}</p>
                </motion.article>
              ))}
            </div>
          </div>

          <SponsorAppPhone className="mx-auto w-full lg:sticky lg:top-28" />
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <h3 className="font-display text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl">
              Huit écrans. Une seule app.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Captures réelles du Pôle Sponsor. Formules dès Découverte (gratuite),
              sans engagement.
            </p>
            <ul className="mt-6 space-y-5">
              {APP_BEATS.map((b) => (
                <li
                  key={b.title}
                  className="border-l-2 border-[var(--pole-accent,#C026D3)] pl-4"
                >
                  <p className="text-sm font-semibold text-white">{b.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/50">{b.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-end gap-6 border border-white/10 bg-gradient-to-br from-[#C026D3]/28 via-[#12010f] to-[#86198F]/40 p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Qui est sur le Pôle Sponsor ?
            </p>
            <p className="font-display text-2xl font-medium tracking-[-0.02em] text-white">
              Marques · Partenaires · Micro-sponsors
            </p>
            <p className="text-sm leading-relaxed text-white/55">
              Offres géolocalisées, dashboard ROI et contact clubs — dans la même app
              que les structures. Clubs et joueurs ont leur pôle dédié.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={ROUTES.sponsorDevis}
                className="inline-flex items-center justify-center bg-[var(--pole-accent,#C026D3)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Demander un devis
              </Link>
              <Link
                href={`${ROUTES.pricing}#sponsor`}
                className="inline-flex items-center justify-center border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50"
              >
                Voir les formules
              </Link>
              <Link
                href={ROUTES.betaWaitlist}
                className="inline-flex items-center justify-center border border-white/25 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50"
              >
                Liste d’attente
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
