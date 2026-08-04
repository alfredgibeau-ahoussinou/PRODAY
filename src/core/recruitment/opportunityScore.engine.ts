/**
 * Opportunity Score — ProDay exclusive.
 * Multi-signal recruitment compatibility (player ↔ club/post ↔ staff context).
 * Distinct from Wyscout-style video stats or TransferRoom xTV: grounded in
 * ProDay Pulse, verification, availability, geo, and Mercato fit.
 */

import type { RecruitmentPost } from '../../models/Player';
import type { User } from '../../models/User';
import { getProfileCompletion } from '../../utils/profileCompletion';
import { resolvePlayerLevel } from '../../utils/playerLevelBadge';
import { distanceBetween } from '../../utils/geoLocation';
import { hasJoueurVerifieBadge } from '../../utils/proPlayerVerification';

export type OpportunityBand = 'excellent' | 'strong' | 'fair' | 'low';

export interface OpportunityScoreBreakdown {
  position: number;
  level: number;
  geo: number;
  availability: number;
  trust: number;
  activity: number;
  pulse: number;
}

export interface OpportunityScoreResult {
  score: number;
  band: OpportunityBand;
  label: string;
  reasons: string[];
  breakdown: OpportunityScoreBreakdown;
  /** 0–1 confidence that inputs are rich enough to trust the score. */
  confidence: number;
}

function normalize(value?: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}

function positionFit(playerPos?: string, targetPos?: string): { score: number; reason?: string } {
  if (!playerPos || !targetPos) return { score: 35 };
  const p = normalize(playerPos);
  const t = normalize(targetPos);
  if (p === t) return { score: 100, reason: `Poste ${playerPos}` };
  if (p.includes(t) || t.includes(p)) return { score: 72, reason: `Poste proche (${playerPos})` };
  return { score: 18 };
}

function levelFit(playerLevel?: string, targetLevel?: string): { score: number; reason?: string } {
  if (!playerLevel || !targetLevel) return { score: 40 };
  const p = normalize(playerLevel);
  const t = normalize(targetLevel);
  if (p === t) return { score: 100, reason: `Niveau ${playerLevel}` };
  if (p.includes(t) || t.includes(p)) return { score: 70, reason: `Niveau proche` };
  return { score: 28 };
}

function geoFit(
  player: User,
  targetCity?: string,
  targetLocation?: RecruitmentPost['location']
): { score: number; reason?: string } {
  const distKm = distanceBetween(player.location, targetLocation);
  if (distKm != null) {
    if (distKm <= 15) return { score: 100, reason: `${Math.round(distKm)} km` };
    if (distKm <= 40) return { score: 78, reason: `${Math.round(distKm)} km` };
    if (distKm <= 80) return { score: 52, reason: `${Math.round(distKm)} km` };
    return { score: Math.max(12, 40 - distKm / 10) };
  }
  const city = normalize(player.city);
  const target = normalize(targetCity);
  if (city && target && (city === target || city.includes(target) || target.includes(city))) {
    return { score: 88, reason: `Ville ${player.city}` };
  }
  return { score: 42 };
}

function availabilityFit(player: User): { score: number; reason?: string } {
  const a = player.profile.availability;
  if (a === 'available') return { score: 100, reason: 'Disponible' };
  if (a === 'negotiating') return { score: 58, reason: 'En discussion' };
  if (a === 'unavailable') return { score: 18, reason: 'Sous contrat' };
  return { score: 50 };
}

function trustFit(player: User): { score: number; reason?: string } {
  let score = 40;
  const reasons: string[] = [];
  if (hasJoueurVerifieBadge(player)) {
    score += 35;
    reasons.push('Joueur vérifié');
  }
  if (player.is_verified) {
    score += 10;
  }
  const completion = getProfileCompletion(player).percent;
  score += Math.round(completion * 0.15);
  if (completion >= 70) reasons.push(`Profil ${completion}%`);
  return { score: Math.min(100, score), reason: reasons[0] };
}

function activityFit(player: User): { score: number; reason?: string } {
  const stats = player.profile.season_stats;
  let score = 30;
  if (stats && stats.matches > 0) {
    score += Math.min(40, stats.matches * 2);
    score += Math.min(20, (stats.goals + stats.assists) * 2);
    return {
      score: Math.min(100, score),
      reason: `${stats.matches} matchs · ${stats.goals}B ${stats.assists}P`,
    };
  }
  if ((player.profile.highlight_video_urls?.filter(Boolean).length ?? 0) > 0) {
    return { score: 55, reason: 'Highlight vidéo' };
  }
  return { score: 28 };
}

function pulseFit(pulseScore?: number): { score: number; reason?: string } {
  if (pulseScore == null || Number.isNaN(pulseScore)) return { score: 45 };
  const clamped = Math.max(0, Math.min(100, pulseScore));
  if (clamped >= 70) return { score: clamped, reason: `Pulse ${Math.round(clamped)}` };
  return { score: clamped };
}

function bandFor(score: number): OpportunityBand {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'strong';
  if (score >= 45) return 'fair';
  return 'low';
}

function labelFor(band: OpportunityBand): string {
  switch (band) {
    case 'excellent':
      return 'Compatibilité excellente';
    case 'strong':
      return 'Forte compatibilité';
    case 'fair':
      return 'Compatibilité moyenne';
    default:
      return 'Faible compatibilité';
  }
}

export interface OpportunityScoreInput {
  player: User;
  /** Club / recruiter posting the need. */
  post?: RecruitmentPost;
  /** Optional Pulse 0–100 for the player. */
  pulseScore?: number;
  /** Staff viewer city/level for soft bias when no post. */
  viewer?: User;
}

/**
 * Compute ProDay Opportunity Score (0–100) for recruitment compatibility.
 */
export function computeOpportunityScore(input: OpportunityScoreInput): OpportunityScoreResult {
  const { player, post, pulseScore, viewer } = input;

  const targetPosition = post?.position ?? viewer?.profile.position;
  const targetLevel = post?.level ?? viewer?.profile.level;
  const targetCity = post?.city ?? viewer?.city;
  const targetLocation = post?.location ?? viewer?.location;

  const pos = positionFit(player.profile.position, targetPosition);
  const lvl = levelFit(player.profile.level, targetLevel);
  const geo = geoFit(player, targetCity, targetLocation);
  const avail = availabilityFit(player);
  const trust = trustFit(player);
  const activity = activityFit(player);
  const pulse = pulseFit(pulseScore);

  const breakdown: OpportunityScoreBreakdown = {
    position: pos.score,
    level: lvl.score,
    geo: geo.score,
    availability: avail.score,
    trust: trust.score,
    activity: activity.score,
    pulse: pulse.score,
  };

  const raw =
    breakdown.position * 0.26 +
    breakdown.level * 0.16 +
    breakdown.geo * 0.14 +
    breakdown.availability * 0.12 +
    breakdown.trust * 0.12 +
    breakdown.activity * 0.1 +
    breakdown.pulse * 0.1;

  let score = Math.round(Math.min(99, Math.max(8, raw)));

  // Academy / amateur emerging talent soft boost when Pulse is rising but stats thin.
  const levelId = resolvePlayerLevel(player);
  if (levelId === 'academy' && breakdown.pulse >= 60 && breakdown.activity < 50) {
    score = Math.min(99, score + 4);
  }

  const reasons = [pos.reason, lvl.reason, geo.reason, avail.reason, trust.reason, activity.reason, pulse.reason]
    .filter((r): r is string => Boolean(r))
    .slice(0, 4);

  const filledSignals = [
    Boolean(player.profile.position),
    Boolean(player.profile.level || player.player_level),
    Boolean(player.city || player.location),
    Boolean(player.profile.availability),
    Boolean(player.profile.season_stats?.matches),
    pulseScore != null,
    Boolean(post),
  ].filter(Boolean).length;

  const confidence = Math.round((filledSignals / 7) * 100) / 100;
  const band = bandFor(score);

  return {
    score,
    band,
    label: labelFor(band),
    reasons,
    breakdown,
    confidence,
  };
}

export function rankByOpportunityScore(
  players: User[],
  opts: Omit<OpportunityScoreInput, 'player'> & { minScore?: number; max?: number }
): Array<{ player: User; opportunity: OpportunityScoreResult }> {
  const minScore = opts.minScore ?? 40;
  const max = opts.max ?? 12;
  return players
    .filter((p) => p.role === 'player')
    .map((player) => ({
      player,
      opportunity: computeOpportunityScore({
        player,
        post: opts.post,
        pulseScore: opts.pulseScore,
        viewer: opts.viewer,
      }),
    }))
    .filter((r) => r.opportunity.score >= minScore)
    .sort((a, b) => b.opportunity.score - a.opportunity.score)
    .slice(0, max);
}
