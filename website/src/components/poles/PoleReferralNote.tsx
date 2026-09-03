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
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Badge Sans Engagement */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-[#02241b] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Sans engagement</span>
          </div>

          {/* Badge Parrainage */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-[#2d1d03] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)]">
            <Gift size={14} className="text-amber-400" />
            <span>Parrainage possible</span>
          </div>
        </div>

        <p className="text-xs font-medium leading-relaxed text-white/70 sm:text-right sm:text-sm">
          {POLE_REFERRAL_LINE}
        </p>
      </div>
    </aside>
  );
}
