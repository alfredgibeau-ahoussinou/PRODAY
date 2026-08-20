import type { MatchCenterData } from '../../services/footballData';

export type SupporterAgentPermission =
  | 'public_match_data'
  | 'public_lineups'
  | 'public_events'
  | 'public_statistics';

export interface SupporterAgentContext {
  matchId: string;
  homeLabel: string;
  awayLabel: string;
  score?: string;
  status: string;
  competition?: string;
  eventsCount: number;
  hasStatistics: boolean;
}

export interface SupporterAgentReply {
  text: string;
  disclaimer: string;
}

export function buildSupporterAgentContext(data: MatchCenterData): SupporterAgentContext {
  const { item, events, statistics } = data;
  const score =
    item.scoreHome != null && item.scoreAway != null
      ? `${item.scoreHome}-${item.scoreAway}`
      : undefined;
  return {
    matchId: item.id,
    homeLabel: item.homeLabel,
    awayLabel: item.awayLabel,
    score,
    status: item.status,
    competition: item.competitionLabel,
    eventsCount: events.length,
    hasStatistics: Boolean(statistics),
  };
}
