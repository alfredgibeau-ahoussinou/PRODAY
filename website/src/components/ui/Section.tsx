import { Kicker } from "./Kicker";

type SectionProps = {
  kicker?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  id?: string;
  centered?: boolean;
};

export function Section({
  kicker,
  title,
  description,
  children,
  className = "",
  dark = true,
  id,
  centered = true,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`relative py-16 md:py-24 ${dark ? "bg-black text-white" : "bg-[#030303] text-white"} ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {(kicker || title) && (
          <div
            className={`mb-12 max-w-2xl ${centered ? "section-header-centered mx-auto text-center" : ""}`}
          >
            {kicker && (
              <Kicker className={dark ? "" : "text-neutral-500"} centered={centered}>
                {kicker}
              </Kicker>
            )}
            <h2
              className={`font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl ${
                dark
                  ? centered
                    ? "text-[var(--proday-accent)] uppercase tracking-wide"
                    : "text-white"
                  : "text-neutral-950"
              }`}
            >
              {title}
            </h2>
            {description && (
              <p
                className={`mt-4 text-lg leading-relaxed ${dark ? "text-white/60" : "text-neutral-600"}`}
              >
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
