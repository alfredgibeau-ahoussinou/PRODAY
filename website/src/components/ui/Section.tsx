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
  compact?: boolean;
};

export function Section({
  kicker,
  title,
  description,
  children,
  className = "",
  dark = false,
  id,
  centered = true,
  compact = false,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`relative ${compact ? "py-10 md:py-14" : "py-14 md:py-20"} ${id ? "scroll-mt-24" : ""} ${
        dark ? "bg-[#0f1f17] text-white" : "bg-transparent text-[#0f1f17]"
      } ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {(kicker || title) && (
          <div
            className={`${compact ? "mb-8" : "mb-12"} max-w-2xl ${centered ? "section-header-centered mx-auto text-center" : ""}`}
          >
            {kicker && (
              <Kicker className={dark ? "text-[#5eead4]" : "text-[#FF5A1F]"} centered={centered}>
                {kicker}
              </Kicker>
            )}
            <h2
              className={`font-display mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl lg:text-5xl ${
                dark ? "text-white" : "text-[#0f1f17]"
              }`}
            >
              {title}
            </h2>
            {description && (
              <p
                className={`mt-4 text-lg leading-relaxed ${dark ? "text-white/60" : "text-[#4a6356]"}`}
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
