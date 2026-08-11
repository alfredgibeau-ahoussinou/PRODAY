"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { JoueurExperienceTheme } from "@/lib/joueurExperienceTheme";
import { ROUTES } from "@/lib/routes";
import { JoueurPricingBlock } from "./JoueurPricingBlock";
import { ProfileSwitch } from "./YouthUniverse";

const JoueurWorldCanvas = dynamic(
  () => import("./JoueurWorldCanvas").then((m) => m.JoueurWorldCanvas),
  { ssr: false },
);

const ease = [0.22, 1, 0.36, 1] as const;

function metricsFor(isWoman: boolean) {
  return [
    { k: "Minutes", v: isWoman ? "82'" : "78'", d: "+12 vs N-1" },
    { k: "xG", v: isWoman ? "0.51" : "0.42", d: "Dernier match" },
    { k: "Pass. clés", v: isWoman ? "4" : "3", d: "Tendance ↑" },
    { k: "Duel %", v: isWoman ? "58" : "61", d: "Stable" },
    { k: "Distance", v: isWoman ? "9.8 km" : "10.4 km", d: "Match" },
    { k: "Sprint", v: isWoman ? "28" : "31", d: "Hautes intensités" },
  ];
}

export function AdultUniverse({ theme }: { theme: JoueurExperienceTheme }) {
  const reduce = useReducedMotion();
  const [focus, setFocus] = useState(0);
  const isWoman = theme.gender === "female";
  const METRICS = metricsFor(isWoman);
  const bars = useMemo(
    () =>
      isWoman ? [48, 61, 74, 52, 69, 83, 58] : [42, 58, 71, 49, 66, 80, 55],
    [isWoman],
  );
  const accent = isWoman ? "#7DD3C7" : "#4C8BFF";

  return (
    <div className="relative bg-[#070b14] text-slate-100">
      <div
        className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8"
        style={{ paddingTop: "var(--joueur-nav-offset, 5.5rem)" }}
      >
        <ProfileSwitch
          label={`Performance · ${isWoman ? "Joueuse" : "Joueur"}`}
          tone="text-slate-400"
        />

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">
              {theme.copy.brand}
            </p>
            <h1 className="mt-3 max-w-xl font-display text-[clamp(2rem,5vw,3.4rem)] font-medium leading-[0.98] tracking-[-0.04em] text-white">
              {theme.copy.heroHeadline}
            </h1>
            <p className="mt-3 max-w-lg text-sm text-slate-400 sm:text-base">
              {theme.copy.heroSupport}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {METRICS.map((m, i) => (
                <button
                  key={m.k}
                  type="button"
                  onClick={() => setFocus(i)}
                  className={`rounded-xl border p-3 text-left sm:p-4 ${
                    focus === i
                      ? "border-white/30 bg-white/10"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <p className="font-mono text-[9px] uppercase text-slate-500">
                    {m.k}
                  </p>
                  <p className="mt-1 font-display text-xl text-white">{m.v}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{m.d}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--pole-accent,#4C8BFF)]">
                Analyse de forme · Ma forme
              </p>
              <p className="mt-2 font-display text-3xl text-white">82%</p>
              <p className="mt-1 text-xs text-slate-400">
                Bonne dynamique · ↑ +7% cette semaine
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Charge · 7 jours · focus {METRICS[focus]?.k}
              </p>
              <div className="mt-4 flex h-24 items-end gap-1.5">
                {bars.map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      background: `linear-gradient(to top, #001F6B, ${accent})`,
                    }}
                    initial={reduce ? false : { height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{
                      delay: 0.1 + i * 0.04,
                      duration: 0.5,
                      ease,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-[10px] uppercase text-slate-500">
                  Assistant IA
                </p>
                <p className="mt-1 font-display text-xl text-white">3,99 €/mois</p>
              </div>
              <div className="rounded-xl border border-white/10 p-3">
                <p className="text-[10px] uppercase text-slate-500">
                  Coach humain
                </p>
                <p className="mt-1 font-display text-xl text-white">~30 €/h</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                href={ROUTES.betaWaitlist}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#0054F0] px-5 text-sm font-semibold text-white"
              >
                {theme.copy.primaryCta}
                <ArrowRight size={16} />
              </Link>
              <a
                href="#tarifs"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/20 px-5 text-sm font-semibold"
              >
                Voir tous les tarifs
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <div className="joueur-3d-stage relative min-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 sm:min-h-[360px]">
              <JoueurWorldCanvas
                kind="pitch_data"
                accent={accent}
                position={theme.position}
                intensity="medium"
                className="h-full w-full"
              />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-400">
                {theme.copy.sceneKicker}
              </p>
              <h2 className="mt-1 font-display text-lg text-white sm:text-xl">
                {theme.copy.sceneTitle}
              </h2>
            </div>
            <div className="relative aspect-[21/9] overflow-hidden rounded-2xl border border-white/10">
              <Image
                src={theme.imagery.hero}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/50">
        <JoueurPricingBlock accent={accent} />
      </div>
    </div>
  );
}
