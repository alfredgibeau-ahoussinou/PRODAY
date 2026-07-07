import type { PoleId } from "@/lib/poles";
import { POLE_STYLES } from "@/lib/poles";
import { Kicker } from "@/components/ui/Kicker";

type PremiumSectionProps = {
  kicker?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  pole?: PoleId;
  className?: string;
  id?: string;
  bordered?: boolean;
  centered?: boolean;
};

export function PremiumSection({
  kicker,
  title,
  description,
  children,
  pole,
  className = "",
  id,
  bordered = true,
  centered = true,
}: PremiumSectionProps) {
  const poleStyles = pole ? POLE_STYLES[pole] : null;

  return (
    <section
      id={id}
      className={`relative py-16 md:py-24 ${
        poleStyles ? `${poleStyles.surface} ${poleStyles.accentTop}` : "bg-black text-white"
      } ${bordered ? "border-b border-white/8" : ""} ${className}`}
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className={`mb-10 max-w-2xl ${centered ? "section-header-centered mx-auto text-center" : ""}`}
        >
          {kicker && (
            <Kicker
              className={poleStyles ? poleStyles.textMuted : ""}
              centered={centered}
            >
              {kicker}
            </Kicker>
          )}
          <h2
            className={`font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${
              poleStyles ? "text-white" : centered ? "text-[var(--proday-accent)] uppercase tracking-wide" : "text-white"
            }`}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-lg leading-relaxed text-white/55">{description}</p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
