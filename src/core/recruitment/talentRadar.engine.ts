/**
 * Talent Radar — ProDay exclusive.
 * Surfaces emerging players before they are widely known: rising Pulse,
 * incomplete market visibility, strong local activity, verified youth/academy.
 * Not a Wyscout video library substitute — a ProDay ecosystem signal.
 */

import type { User } from '../../models/User';
import { getProfileCompletion } from '../../utils/profileCompletion';
import { resolvePlayerLevel } from '../../utils/playerLevelBadge';
import { hasJoueurVerifieBadge } from '../../utils/proPlayerVerification';

export type TalentRadarTier = 'hot' | 'rising' | 'watch' | 'quiet';

export interface TalentRadarSignals {
  pulseMomentum: number;
  underTheRadar: number;
  localActivity: number;
  trustGrowth: number;
  availabilityWindow: number;
}

export interface TalentRadarHit {
  playerUid: string;
  playerName: string;
  score: number;
  tier: TalentRadarTier;
  headline: string;
  signals: TalentRadarSignals;
  reasons: string[];
}

export interface TalentRadarInput {
  players: User[];
  /** Optional map of uid → Pulse 0–100. */
  pulseByUid?: Record<string, number>;
  /** Optional map of uid → Pulse delta over recent window (−100..100). */
  pulseDeltaByUid?: Record<string, number>;
  /** Viewer city for local bias. */
  viewerCity?: string;
  max?: number;
  minScore?: number;
}

function normalize(value?: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function tierFor(score: number): TalentRadarTier {
  if (score >= 78) return 'hot';
  if (score >= 62) return 'rising';
  if (score >= 48) return 'watch';
  return 'quiet';
}

function headlineFor(tier: TalentRadarTier, player: User): string {
  const level = resolvePlayerLevel(player);
  switch (tier) {
    case 'hot':
      return level === 'academy' ? 'Talent centre — trajectoire forte' : 'Profil en accélération';
    case 'rising':
      return 'Signal de progression détecté';
    case 'watch':
      return 'À suivre sur le radar';
    default:
      return 'Signal faible';
  }
}

function scoreOne(
  player: User,
  pulse: number | undefined,
  pulseDelta: number | undefined,
  viewerCity?: string
): TalentRadarHit | null {
  if (player.role !== 'player') return null;

  const reasons: string[] = [];
  const levelId = resolvePlayerLevel(player);
  const stats = player.profile.season_stats;
  const completion = getProfileCompletion(player).percent;
  const highlights = player.profile.highlight_video_urls?.filter(Boolean).length ?? 0;

  // Rising Pulse / activity without being "fully marketed"
  let pulseMomentum = 35;
  if (pulse != null) {
    pulseMomentum = clamp(pulse * 0.7 + (pulseDelta != null ? pulseDelta * 0.8 : 10));
    if (pulse >= 55) reasons.push(`Pulse ${Math.round(pulse)}`);
  }
  if (pulseDelta != null && pulseDelta >= 8) {
    pulseMomentum = clamp(pulseMomentum + 18);
    reasons.push(`+${Math.round(pulseDelta)} Pulse`);
  }

  // Under the radar: incomplete profile or few highlights = less "known"
  let underTheRadar = 50;
  if (completion < 55) {
    underTheRadar += 20;
    reasons.push('Encore peu visible');
  } else if (completion < 75) {
    underTheRadar += 10;
  } else {
    underTheRadar -= 8;
  }
  if (highlights === 0) underTheRadar += 12;
  if (levelId === 'professional' && completion >= 85 && highlights >= 2) {
    underTheRadar = Math.max(15, underTheRadar - 25);
  }
  underTheRadar = clamp(underTheRadar);

  // Local activity: matches + goals without needing broadcast video
  let localActivity = 25;
  if (stats && stats.matches > 0) {
    localActivity = clamp(30 + stats.matches * 3 + (stats.goals + stats.assists) * 4);
    reasons.push(`${stats.matches} matchs saison`);
  }
  if (viewerCity && normalize(player.city) === normalize(viewerCity)) {
    localActivity = clamp(localActivity + 15);
    reasons.push(`Proche (${player.city})`);
  }

  // Trust growth: verified youth/academy is high-signal for early discovery
  let trustGrowth = 30;
  if (hasJoueurVerifieBadge(player)) {
    trustGrowth += 35;
    reasons.push('Joueur vérifié');
  }
  if (levelId === 'academy') {
    trustGrowth += 18;
    reasons.push('Centre / aspirant');
  } else if (levelId === 'amateur') {
    trustGrowth += 10;
  }

  // Availability window
  let availabilityWindow = 45;
  if (player.profile.availability === 'available') {
    availabilityWindow = 95;
    reasons.push('Disponible');
  } else if (player.profile.availability === 'negotiating') {
    availabilityWindow = 60;
  } else if (player.profile.availability === 'unavailable') {
    availabilityWindow = 20;
  }

  const signals: TalentRadarSignals = {
    pulseMomentum: clamp(pulseMomentum),
    underTheRadar: clamp(underTheRadar),
    localActivity: clamp(localActivity),
    trustGrowth: clamp(trustGrowth),
    availabilityWindow: clamp(availabilityWindow),
  };

  const score = Math.round(
    clamp(
      signals.pulseMomentum * 0.28 +
        signals.underTheRadar * 0.22 +
        signals.localActivity * 0.22 +
        signals.trustGrowth * 0.16 +
        signals.availabilityWindow * 0.12
    )
  );

  const tier = tierFor(score);
  if (tier === 'quiet' && score < 40) return null;

  return {
    playerUid: player.uid,
    playerName: player.display_name,
    score,
    tier,
    headline: headlineFor(tier, player),
    signals,
    reasons: reasons.slice(0, 4),
  };
}

/** Rank emerging talents for staff discovery. */
export function buildTalentRadar(input: TalentRadarInput): TalentRadarHit[] {
  const max = input.max ?? 15;
  const minScore = input.minScore ?? 48;
  const pulseByUid = input.pulseByUid ?? {};
  const pulseDeltaByUid = input.pulseDeltaByUid ?? {};

  return input.players
    .map((player) =>
      scoreOne(player, pulseByUid[player.uid], pulseDeltaByUid[player.uid], input.viewerCity)
    )
    .filter((hit): hit is TalentRadarHit => hit != null && hit.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}

export function talentRadarTierLabel(tier: TalentRadarTier): string {
  switch (tier) {
    case 'hot':
      return 'Priorité radar';
    case 'rising':
      return 'En hausse';
    case 'watch':
      return 'Surveillance';
    default:
      return 'Faible signal';
  }
}
