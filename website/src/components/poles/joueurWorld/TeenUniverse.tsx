"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { useState } from "react";
import type { JoueurExperienceTheme } from "@/lib/joueurExperienceTheme";
import { ROUTES } from "@/lib/routes";
import { JoueurPricingBlock } from "./JoueurPricingBlock";
import { ProfileSwitch } from "./YouthUniverse";

const JoueurWorldCanvas = dynamic(
  () => import("./JoueurWorldCanvas").then((m) => m.JoueurWorldCanvas),
  { ssr: false },
);

const ease = [0.16, 1, 0.3, 1] as const;

function statsFor(isGirl: boolean) {
  return [
    { label: "Niveau", value: isGirl ? 15 : 14, max: 20 },
    { label: "Finition", value: isGirl ? 64 : 62, max: 100 },
    { label: "Vitesse", value: isGirl ? 69 : 71, max: 100 },
    { label: "Vision", value: isGirl ? 66 : 58, max: 100 },
  ];
}

export function TeenUniverse({ theme }: { theme: JoueurExperienceTheme }) {
  const reduce = useReducedMotion();
  const [level, setLevel] = useState(0);
  const [xp, setXp] = useState(340);
  const beat = theme.weekBeats[level] ?? theme.weekBeats[0]!;
  const isGirl = theme.gender === "female";
  const accent = isGirl ? "#7DD3C7" : "#22d3ee";
  const STATS = statsFor(isGirl);

  return (
    <div className="relative bg-[#020617]">
      <div
        className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8"
        style={{ paddingTop: "var(--joueur-nav-offset, 5.5rem)" }}
      >
        <ProfileSwitch
          label={`Univers ado · ${isGirl ? "Joueuse" : "Joueur"}`}
          tone={isGirl ? "text-teal-300/80" : "text-cyan-300/80"}
        />

        <div className="mt-4 grid gap-5 lg:grid-cols-2 lg:items-start">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/15 bg-slate-950/85 p-4 sm:p-6"
          >
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: accent }}
            >
              <Zap size={14} className="fill-current" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em]">
                {xp} XP · {theme.copy.brand}
              </span>
            </div>
            <h1 className="mt-3 font-display text-[clamp(1.85rem,5vw,3rem)] font-medium leading-[0.96] tracking-[-0.04em] text-white">
              {theme.copy.heroHeadline}
            </h1>
            <p className="mt-2 text-sm text-white/60">{theme.copy.heroSupport}</p>

            <div className="mt-6 space-y-3">
              {STATS.map((s, i) => (
                <div key={s.label}>
                  <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wider text-white/45">
                    <span>{s.label}</span>
                    <span style={{ color: accent }}>{s.value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, #0054F0, ${accent})`,
                      }}
                      initial={reduce ? false : { width: 0 }}
                      animate={{ width: `${(s.value / s.max) * 100}%` }}
                      transition={{
                        delay: 0.1 + i * 0.06,
                        duration: 0.65,
                        ease,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                href={ROUTES.betaWaitlist}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-slate-950"
                style={{ backgroundColor: accent }}
              >
                {theme.copy.primaryCta}
                <ArrowRight size={16} />
              </Link>
              <a
                href="#tarifs"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/25 px-5 text-sm font-semibold text-white"
              >
                Prix IA & coach
              </a>
            </div>
          </motion.div>

          <div className="space-y-4">
            <div className="joueur-3d-stage relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#030712]">
              <JoueurWorldCanvas
                kind="pitch_dynamic"
                accent={accent}
                position={theme.position}
                intensity="high"
                className="h-full w-full"
              />
            </div>

            <div className="relative aspect-[21/9] overflow-hidden rounded-2xl border border-white/10">
              <Image
                src={theme.imagery.scene}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/60 to-transparent" />
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/50 p-4 sm:p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                Mission · {beat.day}
              </p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={beat.id}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="mt-2 font-display text-2xl text-white">
                    {beat.title}
                  </h2>
                  <p className="mt-2 text-sm text-white/55">{beat.body}</p>
                </motion.div>
              </AnimatePresence>
              <button
                type="button"
                onClick={() => {
                  setLevel((l) => (l + 1) % theme.weekBeats.length);
                  setXp((x) => x + 25);
                }}
                className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-white"
              >
                Mission suivante (+25 XP)
              </button>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-[10px] uppercase text-white/40">
                    Assistant IA
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    3,99 €/mois
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-[10px] uppercase text-white/40">
                    Coach humain
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">~30 €/h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/60">
        <JoueurPricingBlock accent={accent} />
      </div>
    </div>
  );
}
