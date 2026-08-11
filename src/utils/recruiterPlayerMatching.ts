import type { User } from '../models/User';
import type { RecruitmentPost } from '../models/Player';
import { computeOpportunityScore } from '../core/recruitment/opportunityScore.engine';
import {
  competitionFormMatchingBoost,
  type RecruitmentFormSignal,
} from './competitionExclusives';

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
  pulseScore?: number,
  formSignal?: RecruitmentFormSignal,
): RecruiterPlayerMatch {
  const opportunity = computeOpportunityScore({ player, post, pulseScore });
  const boost = competitionFormMatchingBoost(formSignal);
  const reasons = [...opportunity.reasons];
  if (boost > 0 && formSignal) {
    reasons.push(formSignal.note);
  }

  return {
    player,
    score: Math.min(100, opportunity.score + boost),
    reasons,
    opportunityBand: opportunity.band,
    opportunityLabel: opportunity.label,
  };
}

export function rankPlayersForRecruitmentPost(
  players: User[],
  post: RecruitmentPost,
  excludeUids: string[] = [],
  max = 8,
  pulseByUid?: Record<string, number>,
  formSignalsByUid?: Record<string, RecruitmentFormSignal>,
): RecruiterPlayerMatch[] {
  const excluded = new Set(excludeUids);
  return players
    .filter((p) => p.role === 'player' && !excluded.has(p.uid))
    .map((player) =>
      scorePlayerForRecruitmentPost(
        player,
        post,
        pulseByUid?.[player.uid],
        formSignalsByUid?.[player.uid],
      ),
    )
    .filter((m) => m.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}
