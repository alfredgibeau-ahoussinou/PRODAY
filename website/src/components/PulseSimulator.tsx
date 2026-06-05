"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useMemo, useState } from "react";
import { Reveal } from "./Reveal";
import { UNIVERSE_THEME } from "@/components/universe/universeTheme";
import type { ProductLineWeb } from "@/lib/content";

type SliderKey = "profile" | "stats" | "activity" | "trust";

const SLIDERS: { key: SliderKey; label: string; hint: string }[] = [
  { key: "profile", label: "Profil complété", hint: "Bio, photo, poste" },
  { key: "stats", label: "Stats saison", hint: "Buts, passes, matchs" },
  { key: "activity", label: "Activité", hint: "Candidatures, RSVP" },
  { key: "trust", label: "Confiance", hint: "Vérifications, avis" },
];

function scoreLabel(score: number): string {
  if (score >= 85) return "Élite visible";
  if (score >= 70) return "Très visible";
  if (score >= 50) return "En progression";
  return "À compléter";
}

type PulseSimulatorProps = {
  fullPage?: boolean;
  /** @deprecated Préférer `universe` */
  variant?: "default" | "woman";
  universe?: ProductLineWeb;
};

export function PulseSimulator({
  fullPage,
  variant = "default",
  universe,
}: PulseSimulatorProps) {
  const line: ProductLineWeb =
    universe ?? (variant === "woman" ? "woman" : "homme");
  const theme = UNIVERSE_THEME[line];

  const [values, setValues] = useState<Record<SliderKey, number>>({
    profile: 65,
    stats: 40,
    activity: 55,
    trust: 70,
  });

  const score = useMemo(() => {
    const w = { profile: 0.3, stats: 0.25, activity: 0.25, trust: 0.2 };
    return Math.round(
      Object.entries(values).reduce(
        (acc, [k, v]) => acc + v * w[k as SliderKey],
        0,
      ),
    );
  }, [values]);

  const springScore = useSpring(score, { stiffness: 120, damping: 18 });
  const circumference = 2 * Math.PI * 88;
  const dashOffset = useTransform(
    springScore,
    (s) => circumference - (s / 100) * circumference,
  );

  return (
    <section
      className={`${fullPage ? "bg-transparent" : theme.softSectionBg || "bg-white"} ${fullPage ? "py-12" : "scroll-mt-24 py-24"}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {!fullPage && (
          <Reveal>
            <p className="text-sm font-medium tracking-widest text-proday-muted">
              PULSE PRODAY
            </p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Simulez votre score de visibilité
            </h2>
            <p className="mt-4 max-w-lg text-proday-muted">
              Ajustez les curseurs — le Pulse se recalcule en direct, comme dans
              l&apos;application.
            </p>
          </Reveal>
        )}

        <div
          className={`grid gap-12 lg:grid-cols-2 lg:items-center ${fullPage ? "mt-4" : "mt-14"}`}
        >
          <div className="space-y-6">
            {SLIDERS.map((s) => (
              <div key={s.key}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-proday-muted">{values[s.key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={values[s.key]}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      [s.key]: Number(e.target.value),
                    }))
                  }
                  className={`h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 ${theme.pulseSliderAccent}`}
                  aria-label={s.label}
                />
                <p className="mt-1 text-xs text-proday-muted">{s.hint}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center">
            <div className="relative">
              <svg width={200} height={200} className="-rotate-90">
                <circle
                  cx={100}
                  cy={100}
                  r={88}
                  fill="none"
                  stroke="#e5e5e5"
                  strokeWidth={12}
                />
                <motion.circle
                  cx={100}
                  cy={100}
                  r={88}
                  fill="none"
                  stroke={theme.pulseStroke}
                  strokeWidth={12}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  style={{ strokeDashoffset: dashOffset }}
                />
              </svg>
              <motion.div
                key={score}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <span className="text-5xl font-bold">{score}</span>
                <span className="text-sm text-proday-muted">/ 100</span>
              </motion.div>
            </div>
            <motion.p
              key={scoreLabel(score)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-lg font-semibold"
            >
              {scoreLabel(score)}
            </motion.p>
            <p className="mt-2 text-center text-sm text-proday-muted">
              {line === "woman"
                ? "Plus le Pulse monte, plus vous êtes visible des clubs et coachs F."
                : line === "pro"
                  ? "Plus le Pulse monte, plus votre profil pro gagne en crédibilité."
                  : "Plus le Pulse monte, plus vous êtes visible des clubs et coachs."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
