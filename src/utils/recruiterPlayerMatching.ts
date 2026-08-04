import type { User } from '../models/User';
import type { RecruitmentPost } from '../models/Player';
import { computeOpportunityScore } from '../core/recruitment/opportunityScore.engine';

export interface RecruiterPlayerMatch {
  player: User;
  score: number;
  reasons: string[];
  /** ProDay Opportunity Score band when computed against a post. */
  opportunityBand?: 'excellent' | 'strong' | 'fair' | 'low';
  opportunityLabel?: string;
}

/** Score un joueur du répertoire Firestore contre une annonce Mercato. */
export function scorePlayerForRecruitmentPost(
  player: User,
  post: RecruitmentPost,
  pulseScore?: number
): RecruiterPlayerMatch {
  const opportunity = computeOpportunityScore({ player, post, pulseScore });

  return {
    player,
    score: opportunity.score,
    reasons: opportunity.reasons,
    opportunityBand: opportunity.band,
    opportunityLabel: opportunity.label,
  };
}

export function rankPlayersForRecruitmentPost(
  players: User[],
  post: RecruitmentPost,
  excludeUids: string[] = [],
  max = 8,
  pulseByUid?: Record<string, number>
): RecruiterPlayerMatch[] {
  const excluded = new Set(excludeUids);
  return players
    .filter((p) => p.role === 'player' && !excluded.has(p.uid))
    .map((player) =>
      scorePlayerForRecruitmentPost(player, post, pulseByUid?.[player.uid])
    )
    .filter((m) => m.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}
