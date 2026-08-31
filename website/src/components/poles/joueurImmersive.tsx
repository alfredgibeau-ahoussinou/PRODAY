"use client";

import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { JoueurWeekBeat } from "@/lib/joueurExperienceTheme";
import { ROUTES } from "@/lib/routes";

const ease = [0.22, 1, 0.36, 1] as const;

const DEFAULT_WEEK: JoueurWeekBeat[] = [
  {
    id: "lun",
    day: "Lun",
    chip: "Objectif",
    title: "Objectifs de la semaine",
    body: "Développe ton potentiel avec des cibles mesurables.",
  },
  {
    id: "mar",
    day: "Mar",
    chip: "Séance",
    title: "Préparation",
    body: "Charge, consignes, présence. Optimise ta performance.",
  },
  {
    id: "mer",
    day: "Mer",
    chip: "Logistique",
    title: "Covoiturage & planning",
    body: "Trajets liés aux séances. Moins de friction, plus de focus.",
  },
  {
    id: "jeu",
    day: "Jeu",
    chip: "Data",
    title: "Statistiques",
    body: "Minutes, heatmaps, tendances. Analyse tes données.",
  },
  {
    id: "ven",
    day: "Ven",
    chip: "Prépa",
    title: "Préparation match",
    body: "Activation, matériel, briefing. Environnement de performance.",
  },
  {
    id: "sam",
    day: "Sam",
    chip: "Match",
    title: "Performance du dernier match",
    body: "Score, actions clés, historique. Les données suivent le terrain.",
  },
  {
    id: "dim",
    day: "Dim",
    chip: "Revue",
    title: "Analyse & progression",
    body: "Bilan, objectifs, et préparation du cycle suivant.",
  },
];

type WeekProps = {
  kicker?: string;
  title?: string;
  subtitle?: string;
  beats?: JoueurWeekBeat[];
};

/** Interactive week timeline — copy pilotée par le thème âge. */
export function JoueurWeekStory({
  kicker = "Une semaine type",
  title = "Juste ton foot.",
  subtitle,
  beats = DEFAULT_WEEK,
}: WeekProps) {
  const [active, setActive] = useState(beats[0]?.id ?? "lun");
  const beat = beats.find((b) => b.id === active) ?? beats[0]!;
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-white/10 bg-[#07070a] px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#FFFFFF)]">
          {kicker}
        </p>
        <h2 className="mt-3 max-w-lg font-display text-[clamp(1.9rem,4.5vw,3rem)] font-medium tracking-[-0.03em] text-white">
          {title}
          {subtitle ? (
            <>
              <br />
              <span className="text-white/40">{subtitle}</span>
            </>
          ) : null}
        </h2>

        <div className="mt-12 flex gap-2 overflow-x-auto pb-2">
          {beats.map((b) => {
            const on = b.id === active;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setActive(b.id)}
                className={`flex min-w-[4.5rem] flex-col items-center rounded-2xl px-3 py-4 transition ${
                  on
                    ? "bg-[var(--pole-accent,#FFFFFF)] text-white"
                    : "border border-white/12 text-white/55 hover:border-white/25"
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
                  {b.day}
                </span>
                <span className="mt-1 text-center text-xs font-semibold leading-tight">
                  {b.chip}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={beat.id}
            initial={reduce ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -8 }}
            transition={{ duration: 0.3, ease }}
            className="mt-10 max-w-xl border-l-2 border-[var(--pole-accent,#FFFFFF)] pl-6"
          >
            <p className="font-display text-2xl font-medium tracking-[-0.02em] text-white">
              {beat.title}
            </p>
            <p className="mt-3 text-base leading-relaxed text-white/60">{beat.body}</p>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-white/35">
              Inclus dans le gratuit
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

type Tier = "free" | "pass";

const FREE_PERKS = [
  "Profil & réseau",
  "Stats de base",
  "Convocations",
  "Covoiturage",
  "Messagerie & événements",
];

const PASS_PERKS = [
  "Entraînements IA perso",
  "Heatmaps & stats avancées",
  "Analyse vidéo",
  "Passeport recruteur",
  "Objectifs & comparaisons",
];

type FreePassProps = {
  kicker?: string;
  title?: string;
  subtitle?: string;
};

/** Friendly free vs Pass toggle. */
export function JoueurFreeVsPass({
  kicker = "Clair et net",
  title = "Gratuit pour jouer.",
  subtitle = "Pass si tu veux aller plus loin.",
}: FreePassProps) {
  const [tier, setTier] = useState<Tier>("free");
  const reduce = useReducedMotion();
  const perks = tier === "free" ? FREE_PERKS : PASS_PERKS;

  return (
    <section className="border-t border-white/10 bg-black px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#FFFFFF)]">
          {kicker}
        </p>
        <h2 className="mt-3 max-w-xl font-display text-[clamp(1.9rem,4.5vw,3rem)] font-medium tracking-[-0.03em] text-white">
          {title}
          <br />
          <span className="text-white/40">Pass si tu veux aller plus loin.</span>
        </h2>
        <p className="mt-4 max-w-md text-sm text-white/55">{subtitle}</p>

        <div
          className="mt-10 inline-flex rounded-full border border-white/15 p-1"
          role="tablist"
          aria-label="Gratuit ou Pass"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tier === "free"}
            onClick={() => setTier("free")}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
              tier === "free"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white"
            }`}
          >
            Gratuit
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tier === "pass"}
            onClick={() => setTier("pass")}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
              tier === "pass"
                ? "bg-[var(--pole-accent,#FFFFFF)] text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Pass · 3,99 €
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.ul
            key={tier}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease }}
            className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            role="tabpanel"
          >
            {perks.map((p, i) => (
              <li
                key={p}
                className="flex items-center gap-3 border-b border-white/10 py-4 text-base text-white/85"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background:
                      tier === "free"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(30, 58, 255,0.25)",
                    color: tier === "free" ? "#fff" : "#F5D04A",
                  }}
                >
                  {i + 1}
                </span>
                {p}
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>

        <Link
          href={`${ROUTES.pricing}#joueur`}
          className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[var(--pole-accent,#FFFFFF)]"
        >
          Voir le détail du Pass
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

type CtaProps = {
  kicker?: string;
  title?: string;
  body?: string;
};

/** Soft closing band. */
export function JoueurWarmCta({
  kicker = "On y va",
  title = "Crée ton compte.\nRejoins ton équipe.",
  body = "Gratuit pour démarrer. Pas besoin d’être pro pour te sentir chez toi.",
}: CtaProps) {
  const lines = title.split("\n");
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black px-4 py-24 sm:px-6 sm:py-32">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 80%, var(--joueur-glow, rgba(30, 58, 255,0.28)), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#FFFFFF)]">
          {kicker}
        </p>
        <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em] text-white">
          {lines.map((line, i) => (
            <span key={i}>
              {i > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </h2>
        <p className="mx-auto mt-5 max-w-md text-base text-white/55">{body}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href={ROUTES.betaWaitlist}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--pole-accent,#FFFFFF)] px-7 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Je m’inscris
            <ArrowRight size={16} />
          </Link>
          <Link
            href={ROUTES.demo + "?p=joueur"}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white/85 transition hover:border-white/50"
          >
            Essayer la démo
          </Link>
        </div>
      </div>
    </section>
  );
}
