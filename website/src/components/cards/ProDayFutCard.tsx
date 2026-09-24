"use client";

import {
  FutBackDetails,
  FutCardShell,
  FutFaceLayout,
  StatBar,
  clampStat,
  nationCode,
} from "@/components/cards/FutCardShell";
import type {
  ProDayCardActionId,
  ProDayCardData,
  ProDayPlayerCardData,
  ProDayCoachCardData,
  ProDayClubCardData,
} from "@/lib/prodayCards";

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
        { label: "MAT", value: (card as ProDayCoachCardData).matches || 0 },
        { label: "NOTE", value: clampStat(ovr - 2) },
        { label: "VIC", value: (card as ProDayCoachCardData).winRatePct || 0 },
      ]
    : [
        { label: "XP", value: ovr },
        { label: "LVL", value: 4 },
        { label: "PRO", value: 100 },
      ];

  const primaryPosition = card.role === "player" ? card.primaryPosition :
                          card.role === "coach" ? "COA" : "PRO";

  const flagNationality = card.role === "player" ? (card as ProDayPlayerCardData).nationality : "FRA";
  const clubLabel = card.role === "player"
    ? (card as ProDayPlayerCardData).clubName
    : card.role === "club"
    ? (card as ProDayClubCardData).city
    : card.displayName;
  const photo = card.photoUrl || undefined;
  const lastName = card.role === "player" ? (card as ProDayPlayerCardData).lastName : card.displayName;

  return (
    <FutCardShell
      card={card}
      onAction={onAction}
      formationLabel={formationLabel ?? primaryPosition}
      front={
        <FutFaceLayout
          rating={ovr}
          position={primaryPosition}
          flagLabel={nationCode(flagNationality)}
          clubLabel={clubLabel}
          photoUrl={photo}
          name={lastName}
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
