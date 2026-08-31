import type { PoleId } from "@/lib/poles";
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
  pole: _pole,
  className = "",
  id,
  bordered = true,
  centered = false,
}: PremiumSectionProps) {
  void _pole;

  return (
    <section
      id={id}
      className={`relative bg-black py-14 text-white md:py-20 ${id ? "scroll-mt-24" : ""} ${
        bordered ? "border-b border-white/10" : ""
      } ${className}`}
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className={`mb-10 max-w-2xl ${centered ? "section-header-centered mx-auto text-center" : ""}`}
        >
          {kicker ? (
            <Kicker className="font-mono text-[#F5D04A]" centered={centered}>
              {kicker}
            </Kicker>
          ) : null}
          <h2 className="font-display mt-3 text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-white/55 sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}
