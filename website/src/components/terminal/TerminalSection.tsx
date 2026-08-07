type TerminalSectionProps = {
  kicker?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  id?: string;
  className?: string;
  bordered?: boolean;
};

/** Mono blue kicker + display title + one short supporting line. */
export function TerminalSection({
  kicker,
  title,
  description,
  children,
  id,
  className = "",
  bordered = true,
}: TerminalSectionProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 bg-black px-4 py-16 sm:px-6 sm:py-24 ${
        bordered ? "border-b border-white/10" : ""
      } ${className}`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          {kicker ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#4C8BFF)]">
              {kicker}
            </p>
          ) : null}
          <h2 className="mt-4 font-display text-[clamp(1.75rem,4vw,3rem)] font-medium leading-[1.08] tracking-[-0.035em] text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/55">
              {description}
            </p>
          ) : null}
        </div>
        {children ? <div className="mt-12">{children}</div> : null}
      </div>
    </section>
  );
}
