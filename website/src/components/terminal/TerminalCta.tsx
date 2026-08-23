import Link from "next/link";

type TerminalCtaProps = {
  title: string;
  description?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
};

/** Closing cinematic band before the footer. */
export function TerminalCta({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  className = "",
}: TerminalCtaProps) {
  return (
    <section
      className={`relative overflow-hidden border-t border-white/10 bg-black px-4 py-24 sm:px-6 sm:py-32 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 70% 50%, var(--pole-accent-glow, rgba(30, 58, 255, 0.35)), transparent 60%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#5B75FF)]">
          Suite
        </p>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h2 className="max-w-3xl font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.02] tracking-[-0.04em] text-white">
              {title}
            </h2>
            {description ? (
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/55">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href={primaryHref}
              className="bg-accent-gradient inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:brightness-110"
            >
              {primaryLabel}
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link
                href={secondaryHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:border-white/45 hover:text-[var(--pole-accent,#5B75FF)]"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
