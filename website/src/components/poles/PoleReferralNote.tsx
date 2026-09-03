import { ShieldCheck, Gift } from "lucide-react";
import { POLE_REFERRAL_LINE } from "@/lib/commercialCopy";

type PoleReferralNoteProps = {
  /** Variante sombre (après hero immersif) ou claire. */
  tone?: "dark" | "ink";
  className?: string;
};

/**
 * Bandeau compact et percutant : Sans engagement & Parrainage disponible sur le pôle.
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
          ? "border-white/10 bg-[#060608] text-white"
          : "border-black/10 bg-[#0a0a0c] text-white"
      } ${className}`}
      aria-label="Avantages commerciaux"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          {/* Texte Sans Engagement */}
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Sans engagement
          </span>

          <span className="text-white/30">·</span>

          {/* Texte Parrainage */}
          <span className="inline-flex items-center gap-1.5 font-bold text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Parrainage possible
          </span>
        </div>

        <p className="text-xs font-medium leading-relaxed text-white/70 sm:text-right sm:text-sm">
          {POLE_REFERRAL_LINE}
        </p>
      </div>
    </aside>
  );
}
