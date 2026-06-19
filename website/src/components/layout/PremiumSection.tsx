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
}: PremiumSectionProps) {
  const poleStyles = pole ? POLE_STYLES[pole] : null;

  return (
    <section
      id={id}
      className={`relative py-16 sm:py-24 ${
        poleStyles ? `${poleStyles.surface} ${poleStyles.accentTop}` : "bg-[#030303] text-white"
      } ${bordered ? "border-b border-white/8" : ""} ${className}`}
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          {kicker && (
            <Kicker className={poleStyles ? poleStyles.textMuted : "text-white/40"}>
              {kicker}
            </Kicker>
          )}
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
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
