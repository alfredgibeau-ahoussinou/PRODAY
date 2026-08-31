"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { RoleVisualId } from "@/lib/roleVisuals";
import type {
  JoueurPositionGroup,
  JoueurSceneKind,
} from "@/lib/joueurExperienceTheme";
import { WebGlErrorBoundary } from "./WebGlErrorBoundary";

const RoleAccentCanvas = dynamic(
  () => import("./RoleAccentCanvas").then((m) => m.RoleAccentCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(76,139,255,0.12),transparent_65%)]" />
    ),
  },
);

type RoleAccentStageProps = {
  role: RoleVisualId;
  kicker?: string;
  title?: string;
  support?: string;
  sceneKind?: JoueurSceneKind;
  position?: JoueurPositionGroup;
  animationIntensity?: "soft" | "medium" | "high";
  motifs?: string[];
  positionMotif?: string;
};

/**
 * Full-bleed premium 3D accent. Lazy-mounts WebGL only when near viewport.
 * One composition: dominant object + minimal overlay copy.
 */
export function RoleAccentStage({
  role,
  kicker = "Immersion",
  title = "Le terrain, en volume.",
  support,
  sceneKind,
  position,
  animationIntensity = "medium",
  motifs,
  positionMotif,
}: RoleAccentStageProps) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { rootMargin: "140px", threshold: 0.04 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden border-b border-white/10 bg-black"
      aria-label="Accent 3D"
      style={
        {
          "--pole-accent": "var(--pole-accent, #F5D04A)",
        } as React.CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 42%, color-mix(in srgb, var(--pole-accent, #F5D04A) 18%, transparent), transparent 70%), radial-gradient(ellipse 40% 40% at 80% 20%, var(--joueur-scene-tint, transparent), transparent 55%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative h-[380px] sm:h-[420px] lg:h-[460px]">
          {active ? (
            <WebGlErrorBoundary>
              <RoleAccentCanvas
                role={role}
                className="absolute inset-0 h-full w-full"
                sceneKind={sceneKind}
                position={position}
                animationIntensity={animationIntensity}
              />
            </WebGlErrorBoundary>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--pole-accent, #F5D04A) 14%, transparent), transparent 58%)",
              }}
            />
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-1 pb-8 sm:pb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#F5D04A)]">
              {kicker}
            </p>
            <h2 className="mt-3 max-w-lg font-display text-[clamp(1.45rem,3.4vw,2.15rem)] font-medium leading-[1.1] tracking-[-0.03em] text-white">
              {title}
            </h2>
            {support ? (
              <p className="mt-2 max-w-md text-sm text-white/50">{support}</p>
            ) : null}
            {(motifs?.length || positionMotif) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {motifs?.map((m) => (
                  <span
                    key={m}
                    className="border border-white/12 bg-black/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/60"
                  >
                    {m}
                  </span>
                ))}
                {positionMotif ? (
                  <span className="border border-[var(--pole-accent,#F5D04A)]/35 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/75">
                    {positionMotif}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
