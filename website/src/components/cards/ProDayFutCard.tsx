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
import { resolveFutSkin } from "@/lib/futSkins";
import type { ProDayCardActionId, ProDayCardData } from "@/lib/prodayCards";

type Props = {
  card: ProDayCardData;
  onAction?: (action: ProDayCardActionId) => void;
  formationLabel?: string;
};

export function ProDayFutCard({ card, onAction, formationLabel }: Props) {
  switch (card.role) {
    case "player":
      return <PlayerFutCard card={card} onAction={onAction} formationLabel={formationLabel} />;
    case "coach":
      return <CoachFutCard card={card} onAction={onAction} formationLabel={formationLabel} />;
    case "club":
      return <ClubFutCard card={card} onAction={onAction} formationLabel={formationLabel} />;
    case "supporter":
      return <SupporterFutCard card={card} onAction={onAction} formationLabel={formationLabel} />;
    case "sponsor":
      return <SponsorFutCard card={card} onAction={onAction} formationLabel={formationLabel} />;
  }
}

function BadgeRow({ badges, ink }: { badges: string[]; ink: string }) {
  if (!badges.length) return null;
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-1">
      {badges.slice(0, 5).map((b) => (
        <span
          key={b}
          className="rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-wide"
          style={{ background: "rgba(0,0,0,0.16)", color: ink }}
        >
          {b}
        </span>
      ))}
    </div>
  );
}

function PlayerFutCard({
  card,
  onAction,
  formationLabel,
}: {
  card: Extract<ProDayCardData, { role: "player" }>;
  onAction?: Props["onAction"];
  formationLabel?: string;
}) {
  const t = resolveFutSkin(card.tier, card.skinId);
  const ovr = card.overall;
  const stats = [
    { label: "PAC", value: clampStat(ovr - 2 + (card.formPct > 85 ? 3 : 0)) },
    { label: "SHO", value: clampStat(ovr - 6 + card.goals) },
    { label: "PAS", value: clampStat(ovr - 4 + card.assists) },
    { label: "DRI", value: clampStat(ovr - 1) },
    { label: "DEF", value: clampStat(ovr - 18) },
    { label: "PHY", value: clampStat(card.formPct * 0.95) },
  ];

  return (
    <FutCardShell
      card={card}
      onAction={onAction}
      formationLabel={formationLabel ?? card.primaryPosition}
      front={
        <FutFaceLayout
          rating={ovr}
          position={card.primaryPosition}
          flagLabel={nationCode(card.nationality)}
          clubLabel={card.clubName}
          leagueLabel={card.league}
          photoUrl={card.photoUrl}
          name={card.lastName}
          stats={stats}
          ink={t.ink}
          inkMuted={t.inkMuted}
          divider={t.divider}
          upgrade={Math.max(0, card.potential - card.overall)}
        />
      }
      back={
        <FutBackDetails ink={t.ink}>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-55">
            {card.editionLabel ?? "Passeport"}
          </p>
          <p className="mt-1 text-xl font-black uppercase leading-tight">{card.displayName}</p>
          <p className="mt-1 text-[10px] font-semibold opacity-70">
            {card.age} ans · {card.strongFoot} · {card.heightCm} cm · {card.weightKg} kg
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatChip label="Matchs" value={card.matches} animate />
            <StatChip label="Buts" value={card.goals} accent="#fbbf24" animate />
            <StatChip label="Passes" value={card.assists} animate />
            <StatChip label="Minutes" value={card.minutesPlayed} animate />
          </div>
          <div className="mt-4 space-y-2">
            {stats.slice(0, 4).map((s) => (
              <StatBar key={s.label} label={s.label} value={Number(s.value)} ink={t.ink} />
            ))}
          </div>
          <BadgeRow badges={card.skillBadges} ink={t.ink} />
          <p className="mt-3 text-[9px] font-bold opacity-75">{card.progressLabel}</p>
          <p className="mt-auto pt-2 text-[9px] font-bold opacity-70">{card.recruitmentStatus}</p>
        </FutBackDetails>
      }
    />
  );
}

function CoachFutCard({
  card,
  onAction,
  formationLabel,
}: {
  card: Extract<ProDayCardData, { role: "coach" }>;
  onAction?: Props["onAction"];
  formationLabel?: string;
}) {
  const t = resolveFutSkin(card.tier, card.skinId);
  return (
    <FutCardShell
      card={card}
      onAction={onAction}
      formationLabel={formationLabel ?? "COA"}
      front={
        <FutFaceLayout
          rating={card.reputation}
          position="COA"
          flagLabel="FR"
          clubLabel={card.clubName}
          leagueLabel={card.category}
          photoUrl={card.photoUrl}
          name={card.displayName.split(" ").pop()!}
          stats={[
            { label: "WIN", value: card.wins },
            { label: "DRW", value: card.draws },
            { label: "LOS", value: card.losses },
            { label: "WR%", value: card.winRatePct },
            { label: "PLY", value: card.playersDeveloped },
            { label: "MAT", value: card.matches },
          ]}
          ink={t.ink}
          inkMuted={t.inkMuted}
          divider={t.divider}
        />
      }
      back={
        <FutBackDetails ink={t.ink}>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-55">
            {card.editionLabel ?? "Coach"}
          </p>
          <p className="mt-1 text-xl font-black uppercase">{card.displayName}</p>
          <p className="mt-1 text-[10px] opacity-70">{card.coachLevel}</p>
          <p className="mt-3 text-[12px] font-semibold leading-snug">{card.philosophy}</p>
          <p className="mt-3 text-[10px] opacity-70">
            {card.clubName} · {card.preferredFormation}
          </p>
          <div className="mt-4 space-y-2">
            <StatBar label="Victoires %" value={card.winRatePct} max={100} ink={t.ink} />
            <StatBar label="Réputation" value={card.reputation} ink={t.ink} />
          </div>
          <p className="mt-3 text-[9px] opacity-65">{card.modulesUsed.slice(0, 3).join(" · ")}</p>
          <BadgeRow badges={card.skillBadges} ink={t.ink} />
        </FutBackDetails>
      }
    />
  );
}

function ClubFutCard({
  card,
  onAction,
  formationLabel,
}: {
  card: Extract<ProDayCardData, { role: "club" }>;
  onAction?: Props["onAction"];
  formationLabel?: string;
}) {
  const t = resolveFutSkin(card.tier, card.skinId);
  return (
    <FutCardShell
      card={card}
      onAction={onAction}
      formationLabel={formationLabel ?? "CLB"}
      front={
        <FutFaceLayout
          rating={card.standingLabel.match(/\d+/)?.[0] ?? "80"}
          position="CLB"
          flagLabel={nationCode(card.country)}
          clubLabel={card.displayName}
          leagueLabel={card.league}
          photoUrl={card.photoUrl}
          name={card.displayName}
          stats={[
            { label: "LIC", value: card.licensedCount },
            { label: "EQP", value: card.teamsCount },
            { label: "COA", value: card.coachesCount },
            { label: "LVL", value: card.levelLabel.slice(0, 4) },
            { label: "LGE", value: card.league.slice(0, 4) },
            { label: "CTY", value: card.city.slice(0, 4) },
          ]}
          ink={t.ink}
          inkMuted={t.inkMuted}
          divider={t.divider}
        />
      }
      back={
        <FutBackDetails ink={t.ink}>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-55">
            {card.editionLabel ?? "Club"}
          </p>
          <p className="mt-1 text-xl font-black uppercase">{card.displayName}</p>
          <p className="mt-2 text-[11px]">
            {card.city}, {card.country}
          </p>
          <p className="mt-2 text-[12px]">Stade · {card.stadium}</p>
          <p className="mt-2 text-[10px] opacity-75">{card.historyLine}</p>
          <div className="mt-4 grid grid-cols-3 gap-1.5">
            <StatChip label="Licenciés" value={card.licensedCount} animate />
            <StatChip label="Équipes" value={card.teamsCount} animate />
            <StatChip label="Coachs" value={card.coachesCount} animate />
          </div>
          {card.trophies[0] ? (
            <p className="mt-3 text-[10px] font-bold">🏆 {card.trophies[0]}</p>
          ) : null}
          <BadgeRow badges={card.skillBadges} ink={t.ink} />
        </FutBackDetails>
      }
    />
  );
}

function SupporterFutCard({
  card,
  onAction,
  formationLabel,
}: {
  card: Extract<ProDayCardData, { role: "supporter" }>;
  onAction?: Props["onAction"];
  formationLabel?: string;
}) {
  const t = resolveFutSkin(card.tier, card.skinId);
  return (
    <FutCardShell
      card={card}
      onAction={onAction}
      formationLabel={formationLabel ?? "FAN"}
      front={
        <FutFaceLayout
          rating={Math.min(99, Math.round(card.points / 30))}
          position="FAN"
          flagLabel="FR"
          clubLabel={card.favoriteClub}
          leagueLabel="ProDay"
          photoUrl={card.photoUrl}
          name={card.displayName.split(" ").pop()!}
          stats={[
            { label: "PTS", value: card.points },
            { label: "EVT", value: card.eventsAttended },
            { label: "MAT", value: card.matchesFollowed },
            { label: "REF", value: card.referrals },
            { label: "BDG", value: card.badges.length },
            { label: "LOY", value: (card.loyaltyLevel.split(" ").pop() ?? "—").slice(0, 4) },
          ]}
          ink={t.ink}
          inkMuted={t.inkMuted}
          divider={t.divider}
        />
      }
      back={
        <FutBackDetails ink={t.ink}>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-55">
            {card.editionLabel ?? "Supporter"}
          </p>
          <p className="mt-1 text-xl font-black uppercase">{card.displayName}</p>
          <p className="mt-2 text-[11px]">Club · {card.favoriteClub}</p>
          <p className="mt-1 text-[11px] font-bold">{card.loyaltyLevel}</p>
          <div className="mt-4 space-y-2">
            <StatBar
              label="Points fidélité"
              value={Math.min(99, Math.round(card.points / 50))}
              ink={t.ink}
            />
            <StatBar label="Matchs suivis" value={Math.min(99, card.matchesFollowed)} ink={t.ink} />
          </div>
          <BadgeRow badges={card.badges} ink={t.ink} />
        </FutBackDetails>
      }
    />
  );
}

function SponsorFutCard({
  card,
  onAction,
  formationLabel,
}: {
  card: Extract<ProDayCardData, { role: "sponsor" }>;
  onAction?: Props["onAction"];
  formationLabel?: string;
}) {
  const t = resolveFutSkin(card.tier, card.skinId);
  return (
    <FutCardShell
      card={card}
      onAction={onAction}
      formationLabel={formationLabel ?? "SPN"}
      front={
        <FutFaceLayout
          rating={99}
          position="SPN"
          flagLabel="FR"
          clubLabel={card.company}
          leagueLabel={card.sector}
          photoUrl={card.photoUrl}
          name={card.company}
          stats={[
            { label: "CLB", value: card.partnerClubs.length },
            { label: "EVT", value: card.sponsoredEvents },
            { label: "SEC", value: card.sector.slice(0, 4) },
            { label: "LOC", value: card.location.split("·")[0]!.trim().slice(0, 4) },
            { label: "VRP", value: card.verified ? "99" : "50" },
            { label: "TIR", value: 99 },
          ]}
          ink={t.ink}
          inkMuted={t.inkMuted}
          divider={t.divider}
        />
      }
      back={
        <FutBackDetails ink={t.ink}>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-55">
            {card.editionLabel ?? "Sponsor"}
          </p>
          <p className="mt-1 text-xl font-black uppercase">{card.company}</p>
          <p className="mt-2 text-[11px] opacity-75">{card.sector}</p>
          <ul className="mt-4 space-y-1.5">
            {card.partnerClubs.map((c) => (
              <li key={c} className="text-[12px] font-semibold">
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatChip label="Clubs" value={card.partnerClubs.length} animate />
            <StatChip label="Events" value={card.sponsoredEvents} animate />
          </div>
          <BadgeRow badges={card.skillBadges} ink={t.ink} />
        </FutBackDetails>
      }
    />
  );
}
