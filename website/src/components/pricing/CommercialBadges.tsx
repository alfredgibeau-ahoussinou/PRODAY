"use client";

type CommercialBadgesProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "center" | "right";
  showDescriptions?: boolean;
};

/**
 * Mentions commerciales intégrées élégamment en texte pur coloré :
 * 1. "Sans engagement" (Vert émeraude vif #10B981)
 * 2. "Parrainage possible" (Or / Ambre chaud #F59E0B)
 */
export function CommercialBadges({
  className = "",
  size = "md",
  align = "left",
  showDescriptions = false,
}: CommercialBadgesProps) {
  const alignClasses = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  }[align];

  const textSize = {
    sm: "text-xs gap-x-3 gap-y-1",
    md: "text-sm sm:text-base gap-x-4 gap-y-1.5",
    lg: "text-base sm:text-lg gap-x-6 gap-y-2",
  }[size];

  return (
    <div className={`flex flex-wrap items-center ${alignClasses} ${textSize} ${className}`}>
      {/* 1. Sans engagement (Texte Vert Émeraude Vif) */}
      <span className="inline-flex items-center gap-1.5 font-bold tracking-tight text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Sans engagement
      </span>

      <span className="text-white/30">·</span>

      {/* 2. Parrainage possible (Texte Or / Ambre Vif) */}
      <span className="inline-flex items-center gap-1.5 font-bold tracking-tight text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Parrainage possible
      </span>

      {showDescriptions && (
        <span className="text-xs font-normal text-white/50 sm:ml-2">
          (résiliation libre · code actif dès l’inscription)
        </span>
      )}
    </div>
  );
}
