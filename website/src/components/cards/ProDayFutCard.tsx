"use client";

import {
  FutBackDetails,
  FutCardShell,
  FutFaceLayout,
  StatBar,
  StatChip,
  clampStat,
  nationCode,
} from "@/components/cards/FutCardShell";
import type { ProDayCardActionId, ProDayCardData } from "@/lib/prodayCards";

type Props = {
  card: ProDayCardData;
  onAction?: (action: ProDayCardActionId) => void;
  formationLabel?: string;
};

export function ProDayFutCard({ card, onAction, formationLabel }: Props) {
  const ovr = card.role === "player" ? card.overall : 85;
  
  // Minimal stats based on role
  const statsList = card.role === "player"
    ? [
        { label: "MAT", value: card.matches },
        { label: "NOTE", value: clampStat(ovr - 2) },
        { label: "G+A", value: card.goals + card.assists },
      ]
    : card.role === "coach"
    ? [
        { label: "MAT", value: (card as any).matchesManaged || 0 },
        { label: "NOTE", value: clampStat(ovr - 2) },
        { label: "VIC", value: (card as any).winRatePct || 0 },
      ]
    : [
        { label: "XP", value: ovr },
        { label: "LVL", value: 4 },
        { label: "PRO", value: 100 },
      ];

  const primaryPosition = card.role === "player" ? card.primaryPosition :
                          card.role === "coach" ? "COA" : "PRO";

  return (
    <FutCardShell
      card={card}
      onAction={onAction}
      formationLabel={formationLabel ?? primaryPosition}
      front={
        <FutFaceLayout
          rating={ovr}
          position={primaryPosition}
          flagLabel={nationCode(card.role === "player" || card.role === "coach" ? (card as any).nationality : "FRA")}
          clubLabel={card.role === "player" ? (card as any).clubName : card.role === "club" ? (card as any).city : card.displayName}
          photoUrl={card.role === "player" || card.role === "coach" ? (card as any).photoUrl : undefined}
          name={(card as any).lastName || card.displayName}
          stats={statsList}
          ink="#FFF"
          inkMuted="rgba(255,255,255,0.6)"
          divider="rgba(255,255,255,0.1)"
        />
      }
      back={
        <FutBackDetails ink="#FFF">
          <p className="mt-1 text-xl font-black uppercase leading-tight">{card.displayName}</p>
          <p className="mt-1 text-[10px] font-semibold opacity-70">
            {primaryPosition}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
            {statsList.map((s) => (
              <StatBar key={s.label} label={s.label} value={s.value} ink="#FFF" max={s.label === "VIC" || s.label === "PRO" ? 100 : 99} />
            ))}
          </div>
        </FutBackDetails>
      }
    />
  );
}
