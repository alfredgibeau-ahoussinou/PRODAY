"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { useState } from "react";
import type { JoueurExperienceTheme } from "@/lib/joueurExperienceTheme";
import { ROUTES } from "@/lib/routes";
import { JoueurPricingBlock } from "./JoueurPricingBlock";

const JoueurWorldCanvas = dynamic(
  () => import("./JoueurWorldCanvas").then((m) => m.JoueurWorldCanvas),
  { ssr: false },
);

const ease = [0.16, 1, 0.3, 1] as const;

const CHALLENGES = [
  { id: "1", title: "Pied faible", body: "10 touches contrôlées", xp: 3 },
  { id: "2", title: "Dribbles", body: "Slalom maison ou jardin", xp: 2 },
  { id: "3", title: "Passes", body: "Avec un parent / frère / sœur", xp: 4 },
  { id: "4", title: "Vitesse", body: "5 sprints courts", xp: 3 },
];

const INFO_BLOCKS = [
  {
    title: "Entraînement à la maison",
    body: "Exercices courts, clairs, adaptés à ton âge. Seul ou en famille.",
  },
  {
    title: "Assistant IA (Pass 3,99 €)",
    body: "Programmes perso générés par l’IA · pas un coach humain.",
  },
  {
    title: "Coach humain (~30 €/h)",
    body: "Un vrai coach, payé à la séance. Tarif du coach, sans abo forcé.",
  },
  {
    title: "Parents",
    body: "Ils voient seulement ce qui est autorisé · toi tu restes au centre.",
  },
];

export function YouthUniverse({ theme }: { theme: JoueurExperienceTheme }) {
  const reduce = useReducedMotion();
  const [stars, setStars] = useState(2);
  const [active, setActive] = useState(CHALLENGES[0]!.id);
  const [done, setDone] = useState<Record<string, boolean>>({ "2": true });
  const isGirl = theme.gender === "female";
  const accent = isGirl ? "#7DD3C7" : "#22c55e";

  return (
    <div className="relative bg-gradient-to-b from-[#052e16] via-[#0a1628] to-[#020617]">
      <div
        className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8"
        style={{ paddingTop: "var(--joueur-nav-offset, 5.5rem)" }}
      >
        <ProfileSwitch
          label={`Univers jeune · ${isGirl ? "Joueuse" : "Joueur"}`}
          tone={isGirl ? "text-teal-200/80" : "text-amber-200/80"}
        />

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
          >
            <p
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                isGirl
                  ? "bg-teal-400/20 text-teal-100"
                  : "bg-amber-400/20 text-amber-100"
              }`}
            >
              <Star size={14} className="fill-current" />
              {stars} étoiles · {theme.copy.brand}
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.1rem,7vw,3.8rem)] font-medium leading-[0.95] tracking-[-0.04em] text-white">
              {theme.copy.heroHeadline}
            </h1>
            <p className="mt-3 text-sm text-white/70 sm:text-base">
              {theme.copy.heroSupport}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={ROUTES.betaWaitlist}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold ${
                  isGirl
                    ? "bg-teal-300 text-[#042f2e]"
                    : "bg-amber-400 text-[#052e16]"
                }`}
              >
                {theme.copy.primaryCta}
                <ArrowRight size={16} />
              </Link>
              <a
                href="#tarifs"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white"
              >
                Voir les prix
              </a>
            </div>
          </motion.div>

          {/* Une seule scène 3D, cadre dédié — pas de photo dessous */}
          <div className="joueur-3d-stage relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[#04160c] sm:aspect-[16/11]">
            <JoueurWorldCanvas
              kind="pitch_playful"
              accent={accent}
              position={theme.position}
              intensity="soft"
              className="h-full w-full"
            />
          </div>
        </div>

        <div className="relative mt-6 aspect-[21/9] overflow-hidden rounded-2xl border border-white/10">
          <Image
            src={theme.imagery.hero}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/70 to-transparent" />
        </div>

        <h2 className="mt-12 font-display text-xl text-white sm:text-2xl">
          Tes défis du jour
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CHALLENGES.map((c) => {
            const on = active === c.id;
            const isDone = Boolean(done[c.id]);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActive(c.id);
                  if (!isDone) {
                    setDone((d) => ({ ...d, [c.id]: true }));
                    setStars((s) => Math.min(12, s + c.xp));
                  }
                }}
                className={`rounded-2xl border p-3 text-left sm:p-4 ${
                  on
                    ? isGirl
                      ? "border-teal-300/50 bg-teal-400/20"
                      : "border-amber-300/50 bg-amber-400/20"
                    : "border-white/15 bg-black/35"
                }`}
              >
                <span className="text-[10px] font-bold uppercase text-white/55">
                  {isDone ? "Validé" : `Défi ${c.id}`}
                </span>
                <p className="mt-1 text-sm font-bold text-white">{c.title}</p>
                <p className="mt-1 text-[11px] text-white/50">{c.body}</p>
                <p className="mt-2 text-xs font-semibold">+{c.xp} ★</p>
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {INFO_BLOCKS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-white/10 bg-black/35 p-4"
            >
              <h3 className="font-semibold text-white">{b.title}</h3>
              <p className="mt-1 text-sm text-white/55">{b.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <h3 className="font-display text-xl text-white">{theme.copy.weekTitle}</h3>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {theme.weekBeats.map((b) => (
              <div
                key={b.id}
                className="min-w-[8.5rem] shrink-0 rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <p className="font-mono text-[10px] text-white/45">{b.day}</p>
                <p className="mt-1 text-sm font-bold text-white">{b.chip}</p>
                <p className="mt-1 text-xs text-white/50">{b.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#03120a]/95">
        <JoueurPricingBlock accent={accent} />
      </div>
    </div>
  );
}

export function ProfileSwitch({
  label,
  tone,
}: {
  label: string;
  tone: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span
        className={`font-mono text-[9px] uppercase tracking-[0.24em] sm:text-[10px] ${tone}`}
      >
        {label}
      </span>
      <Link
        href={ROUTES.joueur}
        className="text-xs text-white/50 hover:text-white"
        onClick={() => {
          try {
            sessionStorage.removeItem("proday_joueur_profile_v1");
          } catch {
            /* ignore */
          }
        }}
      >
        Changer de profil
      </Link>
    </div>
  );
}
