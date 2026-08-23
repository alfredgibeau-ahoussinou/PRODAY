"use client";

import { AnimatedMetric } from "@/components/immersive/AnimatedMetric";

export type TerminalValuePillar = {
  metric: string;
  metricLabel?: string;
  title: string;
  body: string;
};

type TerminalValueProps = {
  kicker?: string;
  title: string;
  description?: string;
  pillars: TerminalValuePillar[];
  className?: string;
  id?: string;
};

/** Value band with animated metrics : no decorative side art. */
export function TerminalValue({
  kicker = "Our Value",
  title,
  description,
  pillars,
  className = "",
  id,
}: TerminalValueProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 border-b border-white/10 bg-black px-4 py-16 sm:px-6 sm:py-24 ${className}`}
      aria-label="Our Value"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#5B75FF)]">
          {kicker}
        </p>
        <h2 className="mt-4 max-w-4xl font-display text-[clamp(1.75rem,4vw,3rem)] font-medium leading-[1.08] tracking-[-0.035em] text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/55">
            {description}
          </p>
        ) : null}

        <div className="mt-14 grid gap-10 border-t border-white/10 pt-12 lg:grid-cols-3 lg:gap-8">
          {pillars.map((p) => (
            <div key={p.title} className="group">
              <p className="font-display text-4xl font-medium tracking-[-0.03em] text-[var(--pole-accent,#5B75FF)] sm:text-5xl">
                <AnimatedMetric value={p.metric} />
              </p>
              {p.metricLabel ? (
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                  {p.metricLabel}
                </p>
              ) : null}
              <h3 className="mt-6 font-display text-xl font-medium text-white">
                {p.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
