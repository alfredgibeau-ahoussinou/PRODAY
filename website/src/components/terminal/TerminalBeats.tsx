export type TerminalBeat = {
  title: string;
  body: string;
};

type TerminalBeatsProps = {
  beats: TerminalBeat[];
  className?: string;
};

/** Numbered 01 / 02 / 03 rows : Terminal About pattern. */
export function TerminalBeats({ beats, className = "" }: TerminalBeatsProps) {
  return (
    <ul className={`divide-y divide-white/10 border-y border-white/10 ${className}`}>
      {beats.map((beat, i) => {
        const num = String(i + 1).padStart(2, "0");
        return (
          <li
            key={`${num}-${beat.title}`}
            className="grid gap-4 py-8 sm:grid-cols-[5rem_1fr] sm:gap-10 sm:py-10"
          >
            <span className="font-mono text-sm tabular-nums tracking-[0.12em] text-[var(--pole-accent,#4C8BFF)]/70">
              {num}
            </span>
            <div>
              <h3 className="font-display text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl">
                {beat.title}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
                {beat.body}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
