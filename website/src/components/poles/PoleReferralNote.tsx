import { POLE_REFERRAL_LINE } from "@/lib/commercialCopy";

type PoleReferralNoteProps = {
  /** Variante sombre (après hero immersif) ou claire. */
  tone?: "dark" | "ink";
  className?: string;
};

/**
 * Bandeau compact : parrainage disponible sur le pôle.
 * Placable juste sous le hero ou avant le CTA final.
 */
export function PoleReferralNote({
  tone = "dark",
  className = "",
}: PoleReferralNoteProps) {
  const dark = tone === "dark";
  return (
    <aside
      className={`border-y ${
        dark
          ? "border-white/10 bg-black text-white"
          : "border-black/10 bg-[#0a0a0c] text-white"
      } ${className}`}
      aria-label="Parrainage"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 sm:px-6 sm:py-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--pole-accent,#7C3AED)]">
          Parrainage
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-white/65 sm:text-right sm:text-base">
          {POLE_REFERRAL_LINE}
        </p>
      </div>
    </aside>
  );
}
