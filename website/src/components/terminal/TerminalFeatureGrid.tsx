"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export type TerminalFeature = {
  eyebrow: string;
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
  image?: string;
};

type TerminalFeatureGridProps = {
  kicker?: string;
  title: string;
  features: TerminalFeature[];
  className?: string;
  id?: string;
};

/** Numbered feature grid — text only, Terminal YOS pattern. */
export function TerminalFeatureGrid({
  kicker = "Système",
  title,
  features,
  className = "",
  id,
}: TerminalFeatureGridProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 border-b border-white/10 bg-black px-4 py-16 sm:px-6 sm:py-24 ${className}`}
      aria-label="Features Grid"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#4C8BFF)]">
          {kicker}
        </p>
        <h2 className="mt-4 max-w-3xl font-display text-[clamp(1.75rem,4vw,3rem)] font-medium leading-[1.08] tracking-[-0.035em] text-white">
          {title}
        </h2>

        <div className="mt-14 grid gap-0 border-t border-white/10 sm:grid-cols-2">
          {features.map((f, i) => {
            const num = String(i + 1).padStart(2, "0");
            return (
              <motion.article
                key={`${num}-${f.title}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: (i % 2) * 0.05 }}
                className="group border-b border-white/10 px-0 py-10 transition-colors sm:px-8 sm:odd:border-r sm:odd:pl-0 sm:even:pr-0"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--pole-accent,#4C8BFF)]/75">
                  {num} {f.eyebrow}
                </p>
                <h3 className="mt-5 font-display text-2xl font-medium tracking-[-0.02em] text-white transition-colors group-hover:text-[var(--pole-accent,#4C8BFF)] sm:text-[1.65rem]">
                  {f.title}
                </h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
                  {f.body}
                </p>
                {f.href ? (
                  <Link
                    href={f.href}
                    className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:text-[var(--pole-accent,#4C8BFF)]"
                  >
                    {f.linkLabel ?? "En savoir plus"} →
                  </Link>
                ) : null}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
