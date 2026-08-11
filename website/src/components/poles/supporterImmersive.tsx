"use client";

import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { ROUTES } from "@/lib/routes";

const ease = [0.22, 1, 0.36, 1] as const;

const LIVE_MATCHES = [
  { id: "1", home: "U18 A", away: "Rivaux FC", score: "2 : 1", minute: "67'" },
  { id: "2", home: "Seniors", away: "AS Nord", score: "0 : 0", minute: "12'" },
  { id: "3", home: "Féminines", away: "Olympic", score: "1 : 1", minute: "HT" },
];

/** Fake live board : tap a match to “cheer”. */
export function SupporterLiveBoard() {
  const [active, setActive] = useState(LIVE_MATCHES[0]!.id);
  const match = LIVE_MATCHES.find((m) => m.id === active) ?? LIVE_MATCHES[0]!;
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black px-4 py-20 sm:px-6 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 70% 30%, rgba(60,0,240,0.28), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#3C00F0)]">
          Jour J
        </p>
        <h2 className="mt-3 max-w-xl font-display text-[clamp(1.9rem,4.5vw,3rem)] font-medium tracking-[-0.03em] text-white">
          Le score. En direct.
          <br />
          <span className="text-white/40">Sans payer un centime.</span>
        </h2>
        <p className="mt-4 max-w-md text-base text-white/55">
          Choisis un match. La tribune s’ouvre : clubs ProDay et scores du monde.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {LIVE_MATCHES.map((m) => {
            const on = m.id === active;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActive(m.id)}
                className={`rounded-2xl border px-4 py-5 text-left transition ${
                  on
                    ? "border-[var(--pole-accent,#3C00F0)] bg-[var(--pole-accent,#3C00F0)]/20"
                    : "border-white/12 bg-white/[0.03] hover:border-white/25"
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                  Live · {m.minute}
                </span>
                <p className="mt-2 text-sm text-white/70">
                  {m.home}{" "}
                  <span className="font-display text-lg font-medium text-white">
                    {m.score}
                  </span>{" "}
                  {m.away}
                </p>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={match.id}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-white/10 pt-8"
          >
            <div>
              <p className="font-display text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl">
                {match.home}{" "}
                <span className="text-[var(--pole-accent,#7C3AED)]">{match.score}</span>{" "}
                {match.away}
              </p>
              <p className="mt-2 text-sm text-white/45">
                Tu suis le match. Tu peux rejoindre le débat en un tap.
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-300">
              ● Live {match.minute}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

const TRIBUNE_ZONES = [
  {
    id: "suivis",
    label: "Suivis",
    title: "Sans plafond",
    body: "Clubs, joueurs, tournois. Autant que tu veux. Alertes si tu les actives.",
  },
  {
    id: "debats",
    label: "Débats",
    title: "La voix des tribunes",
    body: "Réactions, question hebdo, fil après-match. Gratuit. Toujours.",
  },
  {
    id: "moments",
    label: "Moments",
    title: "Réels & vibes",
    body: "Vidéos courtes des clubs que tu suis. Et le shop si tu veux le maillot.",
  },
];

export function SupporterTribuneZones() {
  const [active, setActive] = useState(TRIBUNE_ZONES[0]!.id);
  const zone = TRIBUNE_ZONES.find((z) => z.id === active) ?? TRIBUNE_ZONES[0]!;
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-white/10 bg-[#07060f] px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#3C00F0)]">
          Dans la tribune
        </p>
        <h2 className="mt-3 max-w-lg font-display text-[clamp(1.9rem,4.5vw,3rem)] font-medium tracking-[-0.03em] text-white">
          Pas de Mercato.
          <br />
          <span className="text-white/40">Juste le match et les gens.</span>
        </h2>

        <div className="mt-12 flex flex-wrap gap-2">
          {TRIBUNE_ZONES.map((z) => {
            const on = z.id === active;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setActive(z.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  on
                    ? "bg-[var(--pole-accent,#3C00F0)] text-white"
                    : "border border-white/15 text-white/65 hover:border-white/30"
                }`}
              >
                {z.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={zone.id}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease }}
            className="mt-10 max-w-xl"
          >
            <h3 className="font-display text-2xl font-medium text-white">{zone.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-white/60">{zone.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

export function SupporterFreeStamp() {
  return (
    <section className="border-t border-white/10 bg-black px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#3C00F0)]">
            Promesse
          </p>
          <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.2rem)] font-medium tracking-[-0.035em] text-white">
            0 €. Pour de vrai.
          </h2>
          <p className="mt-3 max-w-md text-base text-white/55">
            Pas d’abonnement store. Pas de paywall le jour J. La tribune reste ouverte.
          </p>
        </div>
        <div
          className="flex h-36 w-36 rotate-[-8deg] items-center justify-center rounded-full border-4 border-[var(--pole-accent,#3C00F0)] font-display text-2xl font-bold uppercase tracking-tight text-[var(--pole-accent,#3C00F0)] sm:h-44 sm:w-44 sm:text-3xl"
          aria-hidden
        >
          Free
          <br />
          forever
        </div>
      </div>
    </section>
  );
}

export function SupporterWarmCta() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black px-4 py-24 sm:px-6 sm:py-32">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 80%, rgba(60,0,240,0.32), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#3C00F0)]">
          Entre dans la tribune
        </p>
        <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em] text-white">
          Compte gratuit.
          <br />
          Live le week-end.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href={`${ROUTES.betaWaitlist}?role=supporter`}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--pole-accent,#3C00F0)] px-7 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Je suis supporter
            <ArrowRight size={16} />
          </Link>
          <Link
            href={`${ROUTES.demo}?p=supporter`}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white/85 transition hover:border-white/50"
          >
            Voir la démo
          </Link>
        </div>
      </div>
    </section>
  );
}
