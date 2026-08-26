import Link from "next/link";
import { PRODUCT_POSITIONING } from "@/lib/positioning";
import { ROUTES } from "@/lib/routes";

/**
 * Sections marketing : infrastructure, anti-fragmentation, Notion/Discord, portes d’entrée.
 * Look aligné home (fond clair / bande sombre), sans clutter.
 */
export function ProductPositioning() {
  const { infrastructure, fragmentation, vsTools, entryDoors, proof } =
    PRODUCT_POSITIONING;

  return (
    <>
      <section className="border-t border-[#052424]/10 bg-[#f3f2ec] py-20 text-[#052424] sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#052424]/40">
            {infrastructure.kicker}
          </p>
          <h2 className="mt-5 max-w-2xl font-display text-[clamp(1.75rem,4.5vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.035em]">
            {infrastructure.title}
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#052424]/65 sm:text-[17px]">
            {infrastructure.body}
          </p>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#030303] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
            {fragmentation.kicker}
          </p>
          <h2 className="mt-5 max-w-2xl font-display text-[clamp(1.75rem,4.5vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.035em]">
            {fragmentation.title}
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
            {fragmentation.body}
          </p>
          <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {fragmentation.items.map((item) => (
              <li
                key={item.label}
                className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
              >
                <span className="font-display text-lg font-medium tracking-[-0.02em] text-white">
                  {item.label}
                </span>
                <span className="text-sm text-white/45 sm:text-right">
                  {item.problem}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-[#052424]/10 bg-[#f3f2ec] py-20 text-[#052424] sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#052424]/40">
            {vsTools.kicker}
          </p>
          <h2 className="mt-5 max-w-2xl font-display text-[clamp(1.75rem,4.5vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.035em]">
            {vsTools.title}
          </h2>
          <ul className="mt-12 space-y-8">
            {vsTools.items.map((item) => (
              <li
                key={item.name}
                className={
                  "border-l-2 pl-5 " +
                  (item.highlight
                    ? "border-[#E8B923]"
                    : "border-[#052424]/20")
                }
              >
                <p className="font-display text-xl font-medium tracking-[-0.02em]">
                  {item.name}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#052424]/70">
                  {item.role}
                </p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#052424]/55">
                  {item.note}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black py-20 text-white sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
            {entryDoors.kicker}
          </p>
          <h2 className="mt-5 max-w-2xl font-display text-[clamp(1.75rem,4.5vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.035em]">
            {entryDoors.title}
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
            {entryDoors.body}
          </p>

          <div className="mt-14 border-t border-white/10 pt-14">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
              {proof.kicker}
            </p>
            <h3 className="mt-4 font-display text-2xl font-medium tracking-[-0.03em]">
              {proof.title}
            </h3>
            <ul className="mt-6 space-y-3">
              {proof.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-white/75"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8B923]" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-xl text-xs leading-relaxed text-white/40">
              {proof.disclaimer}
            </p>
            <Link
              href={ROUTES.features}
              className="mt-8 inline-flex text-sm font-semibold text-[#E8B923] underline-offset-2 hover:underline"
            >
              Voir comment ça s&apos;articule →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
