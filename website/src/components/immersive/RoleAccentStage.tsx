"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { RoleVisualId } from "@/lib/roleVisuals";

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
};

/**
 * Full-bleed premium 3D accent. Lazy-mounts WebGL only when near viewport.
 * One composition: dominant object + minimal overlay copy.
 */
export function RoleAccentStage({
  role,
  kicker = "Immersion",
  title = "Le terrain, en volume.",
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
          "--pole-accent": "var(--pole-accent, #4C8BFF)",
        } as React.CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 42%, color-mix(in srgb, var(--pole-accent, #4C8BFF) 18%, transparent), transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative h-[380px] sm:h-[420px] lg:h-[460px]">
          {active ? (
            <RoleAccentCanvas role={role} className="absolute inset-0 h-full w-full" />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--pole-accent, #4C8BFF) 14%, transparent), transparent 58%)",
              }}
            />
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-1 pb-8 sm:pb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#4C8BFF)]">
              {kicker}
            </p>
            <h2 className="mt-3 max-w-lg font-display text-[clamp(1.45rem,3.4vw,2.15rem)] font-medium leading-[1.1] tracking-[-0.03em] text-white">
              {title}
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
