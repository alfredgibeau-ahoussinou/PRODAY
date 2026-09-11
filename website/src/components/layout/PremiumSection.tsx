import type { PoleId } from "@/lib/poles";
import { Kicker } from "@/components/ui/Kicker";
import { Reveal } from "@/components/Reveal";

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
  centered = true,
}: PremiumSectionProps) {
  void _pole;

  return (
    <section
      id={id}
      className={`relative overflow-hidden bg-black py-14 text-white md:py-20 ${id ? "scroll-mt-24" : ""} ${
        bordered ? "border-b border-white/10" : ""
      } ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--pole-accent,#1e3aff)]/35 to-transparent"
        aria-hidden
      />
      <div className="site-frame relative">
        <Reveal
          className={`mb-10 max-w-2xl ${centered ? "section-header-centered" : ""}`}
        >
          {kicker ? (
            <Kicker className="font-mono text-[#F5D04A]" centered={centered}>
              {kicker}
            </Kicker>
          ) : null}
          {centered ? <span className="section-accent-rule" aria-hidden /> : null}
          <h2 className="font-display mt-3 text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p
              className={`mt-4 text-base leading-relaxed text-white/55 sm:text-lg ${
                centered ? "mx-auto max-w-xl" : ""
              }`}
            >
              {description}
            </p>
          ) : null}
        </Reveal>
        <Reveal delay={0.08} className={centered ? "mx-auto w-full" : ""}>
          {children}
        </Reveal>
      </div>
    </section>
  );
}
