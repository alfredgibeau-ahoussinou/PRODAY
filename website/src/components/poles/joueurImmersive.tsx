"use client";

import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { ROUTES } from "@/lib/routes";

const ease = [0.22, 1, 0.36, 1] as const;

type BadgeId = "amateur" | "centre" | "pro";

const BADGES: {
  id: BadgeId;
  label: string;
  color: string;
  soft: string;
  vibe: string;
  line: string;
}[] = [
  {
    id: "amateur",
    label: "Amateur",
    color: "#2563EB",
    soft: "rgba(37, 99, 235, 0.2)",
    vibe: "Le dimanche, sans prise de tête",
    line: "Tu joues pour le plaisir, l’équipe et les après-match. Ton profil suit ta saison — stats, convocations, covoit.",
  },
  {
    id: "centre",
    label: "Centre / Aspirant",
    color: "#16A34A",
    soft: "rgba(22, 163, 74, 0.2)",
    vibe: "Tu montes d’un cran",
    line: "Formation, rythme plus haut. Même app, badge vert. Les recruteurs te trouvent sans que tu changes d’outil.",
  },
  {
    id: "pro",
    label: "Professionnel",
    color: "#EAB308",
    soft: "rgba(234, 179, 8, 0.22)",
    vibe: "Le contrat change. Pas l’app.",
    line: "Signature pro : même historique, badge jaune. Tu restes dans ProDay — pas de migration, pas de reset.",
  },
];

/** Interactive badge picker — warm, not corporate. */
export function JoueurBadgePlayground() {
  const [active, setActive] = useState<BadgeId>("amateur");
  const badge = BADGES.find((b) => b.id === active) ?? BADGES[0]!;
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black px-4 py-20 sm:px-6 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-40 transition-colors duration-500"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 30% 40%, ${badge.soft}, transparent 70%)`,
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#0054F0)]">
          Ton badge
        </p>
        <h2 className="mt-3 max-w-xl font-display text-[clamp(1.9rem,4.5vw,3rem)] font-medium tracking-[-0.03em] text-white">
          Trois niveaux.
          <br />
          <span className="text-white/45">Un seul toi.</span>
        </h2>
        <p className="mt-4 max-w-md text-base text-white/55">
          Tape un badge. Rien ne se perd quand tu progresses — c’est le même profil.
        </p>

        <div className="mt-12 flex flex-wrap gap-3">
          {BADGES.map((b) => {
            const on = b.id === active;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setActive(b.id)}
                className="rounded-full px-5 py-3 text-sm font-semibold transition"
                style={{
                  background: on ? b.color : "transparent",
                  color: on ? (b.id === "pro" ? "#0a0a0a" : "#fff") : "rgba(255,255,255,0.7)",
                  border: on ? `2px solid ${b.color}` : "2px solid rgba(255,255,255,0.15)",
                  boxShadow: on ? `0 0 32px ${b.soft}` : undefined,
                }}
              >
                {b.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={badge.id}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease }}
            className="mt-12 grid gap-8 border-t border-white/10 pt-10 lg:grid-cols-[auto_1fr] lg:items-center"
          >
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full font-display text-sm font-bold uppercase tracking-wide sm:h-36 sm:w-36 sm:text-base"
              style={{
                background: badge.soft,
                color: badge.color,
                boxShadow: `inset 0 0 0 3px ${badge.color}`,
              }}
            >
              {badge.label.split(" ")[0]}
            </div>
            <div>
              <p className="text-lg font-medium text-white sm:text-xl">{badge.vibe}</p>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-white/60">{badge.line}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

const WEEK_BEATS: {
  id: string;
  day: string;
  title: string;
  body: string;
  free: boolean;
}[] = [
  {
    id: "lun",
    day: "Lun",
    title: "Convoc tombe",
    body: "Tu vois qui joue. Tu confirmes en un tap. Simple.",
    free: true,
  },
  {
    id: "mer",
    day: "Mer",
    title: "Séance + covoit",
    body: "Qui prend la voiture ? Places restantes, chat conducteur.",
    free: true,
  },
  {
    id: "jeu",
    day: "Jeu",
    title: "Petit coup d’œil stats",
    body: "Buts, passes, minutes. Ou heatmaps si tu as le Pass.",
    free: true,
  },
  {
    id: "sam",
    day: "Sam",
    title: "Match day",
    body: "Le score, les potes, le fil. Tu joues — l’app suit.",
    free: true,
  },
  {
    id: "dim",
    day: "Dim",
    title: "Après-match",
    body: "Message d’équipe, photos, et demain on recommence.",
    free: true,
  },
];

/** Interactive week timeline — feels like amateur football life. */
export function JoueurWeekStory() {
  const [active, setActive] = useState(WEEK_BEATS[0]!.id);
  const beat = WEEK_BEATS.find((b) => b.id === active) ?? WEEK_BEATS[0]!;
  const reduce = useReducedMotion();

  return (
    <section className="border-t border-white/10 bg-[#07070a] px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#0054F0)]">
          Une semaine type
        </p>
        <h2 className="mt-3 max-w-lg font-display text-[clamp(1.9rem,4.5vw,3rem)] font-medium tracking-[-0.03em] text-white">
          Pas un logiciel RH.
          <br />
          <span className="text-white/40">Juste ton foot.</span>
        </h2>

        <div className="mt-12 flex gap-2 overflow-x-auto pb-2">
          {WEEK_BEATS.map((b) => {
            const on = b.id === active;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setActive(b.id)}
                className={`flex min-w-[4.5rem] flex-col items-center rounded-2xl px-3 py-4 transition ${
                  on
                    ? "bg-[var(--pole-accent,#0054F0)] text-white"
                    : "border border-white/12 text-white/55 hover:border-white/25"
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
                  {b.day}
                </span>
                <span className="mt-1 text-xs font-semibold">{b.title.split(" ")[0]}</span>
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
            className="mt-10 max-w-xl border-l-2 border-[var(--pole-accent,#0054F0)] pl-6"
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

/** Friendly free vs Pass toggle — not a sales deck. */
export function JoueurFreeVsPass() {
  const [tier, setTier] = useState<Tier>("free");
  const reduce = useReducedMotion();
  const perks = tier === "free" ? FREE_PERKS : PASS_PERKS;

  return (
    <section className="border-t border-white/10 bg-black px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#0054F0)]">
          Clair et net
        </p>
        <h2 className="mt-3 max-w-xl font-display text-[clamp(1.9rem,4.5vw,3rem)] font-medium tracking-[-0.03em] text-white">
          Gratuit pour jouer.
          <br />
          <span className="text-white/40">Pass si tu veux aller plus loin.</span>
        </h2>
        <p className="mt-4 max-w-md text-sm text-white/55">
          Personne ne te force. Le Pass à 3,99 €, c’est optionnel — quand tu as envie.
        </p>

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
                ? "bg-[var(--pole-accent,#0054F0)] text-white"
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
                        : "rgba(0,84,240,0.25)",
                    color: tier === "free" ? "#fff" : "#4C8BFF",
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
          className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[var(--pole-accent,#0054F0)]"
        >
          Voir le détail du Pass
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

/** Soft closing band — approachable CTA. */
export function JoueurWarmCta() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black px-4 py-24 sm:px-6 sm:py-32">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 80%, rgba(0,84,240,0.28), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#0054F0)]">
          On y va
        </p>
        <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em] text-white">
          Crée ton compte.
          <br />
          Rejoins ton équipe.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-base text-white/55">
          Gratuit pour démarrer. Pas besoin d’être pro pour te sentir chez toi.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href={ROUTES.betaWaitlist}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--pole-accent,#0054F0)] px-7 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
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
