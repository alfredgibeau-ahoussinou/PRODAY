import type {
  MatchJoinValidation,
  MatchRecommendation,
  MatchRecommendationInput,
  SmartActionRecommendation,
} from '../types/recommendation';
import type { HealthSnapshot } from '../types/health';
import { distanceBetween } from '../../utils/geoLocation';

function inferFormat(levelType: string): MatchRecommendation['format'] {
  if (levelType === 'loisir') return '5v5';
  if (levelType === 'competition') return '11v11';
  return '7v7';
}

function scoreLevel(userLevel?: string, matchLevel?: string): number {
  if (!userLevel || !matchLevel) return 0.5;
  const u = userLevel.toLowerCase();
  const m = matchLevel.toLowerCase();
  if (u === m) return 1;
  if (u.includes(m) || m.includes(u)) return 0.75;
  return 0.4;
}

export function rankScore(score: number): number {
  return Math.round(Math.min(100, Math.max(0, score * 100)));
}

/** Recommandations matchs scorées — niveau, distance, santé (spec §4.4). */
export function buildMatchRecommendations(input: MatchRecommendationInput): MatchRecommendation[] {
  const radiusKm = input.radiusKm ?? 10;

  const recs = input.openMatches.map((match) => {
    const distanceKm = distanceBetween(input.userLocation, match.location);
    const iaLevelScore = scoreLevel(input.userLevel, match.level);
    const healthCompatible =
      input.health.allowIntenseMatch || match.level_type === 'loisir';
    const distScore =
      distanceKm == null ? 0.5 : Math.max(0, 1 - distanceKm / (radiusKm * 2));
    const iaScore = iaLevelScore * 0.5 + distScore * 0.3 + (healthCompatible ? 0.2 : 0);

    return {
      id: match.id,
      title: `${match.requester_club_name} vs ${match.opponent_club_name ?? '?'}`,
      subtitle: match.level_type === 'loisir' ? 'Match loisir' : match.level,
      city: match.city,
      startsAt: match.date,
      distanceKm,
      level: match.level,
      format: inferFormat(match.level_type),
      iaScore: rankScore(iaScore),
      iaLevelScore: rankScore(iaLevelScore),
      healthCompatible,
      tab: 'matchs' as const,
      entityId: match.id,
      location: match.location,
    };
  });

  return recs.sort((a, b) => b.iaScore - a.iaScore).slice(0, 8);
}

export function buildActionRecommendations(
  _health: HealthSnapshot,
  _globalScore: number
): SmartActionRecommendation[] {
  return [];
}

export function validateMatchJoin(params: {
  health: HealthSnapshot;
  distanceKm: number | null;
  levelScore: number;
}): MatchJoinValidation {
  const reasons: string[] = [];

  if (params.health.state === 'INJURY_RISK' || params.health.state === 'OVERLOADED') {
    reasons.push(params.health.coachMessage);
  }
  if (!params.health.allowIntenseMatch) {
    reasons.push('Charge trop élevée pour un match intense.');
  }
  if (params.distanceKm != null && params.distanceKm > 25) {
    reasons.push('Match trop éloigné pour votre journée.');
  }
  if (params.levelScore < 40) {
    reasons.push('Niveau peu compatible avec votre profil.');
  }

  return { allowed: reasons.length === 0, reasons };
}
