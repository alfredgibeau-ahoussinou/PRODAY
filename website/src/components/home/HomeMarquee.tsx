"use client";

const WORDS = [
  "Matchs",
  "Mercato",
  "Covoit",
  "Convocations",
  "Reels",
  "Club",
  "Coach",
  "Parents",
  "Tribune",
  "Pulse",
];

/** Bandeau défilant : énergie jeune. */
export function HomeMarquee() {
  const loop = [...WORDS, ...WORDS];
  return (
    <div className="relative overflow-hidden border-y border-[#0f1f17]/10 bg-[#0f1f17] py-3.5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0f1f17] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0f1f17] to-transparent" />
      <div className="animate-marquee flex w-max gap-8 whitespace-nowrap pl-8">
        {loop.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="inline-flex items-center gap-8 font-display text-sm font-extrabold tracking-wide"
          >
            <span className={i % 2 === 0 ? "text-[#5eead4]" : "text-[#fdba74]"}>{word}</span>
            <span className="text-white/25" aria-hidden>
              ●
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
