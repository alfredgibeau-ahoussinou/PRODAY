import { Kicker } from "./Kicker";

type SectionProps = {
  kicker?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  id?: string;
};

export function Section({
  kicker,
  title,
  description,
  children,
  className = "",
  dark = true,
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`relative py-20 sm:py-28 ${dark ? "bg-[#030303] text-white" : "bg-white text-neutral-900"} ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {(kicker || title) && (
          <div className="mb-12 max-w-2xl">
            {kicker && <Kicker className={dark ? "" : "text-neutral-500"}>{kicker}</Kicker>}
            <h2
              className={`font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl ${dark ? "text-white" : "text-neutral-950"}`}
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
