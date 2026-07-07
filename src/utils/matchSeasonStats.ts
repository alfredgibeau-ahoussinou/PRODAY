import type { LiveMatchAction, PlayerMatchSheetStat, TeamEvent } from '../models/TeamEvent';

export interface SeasonStatsDelta {
  matches: number;
  goals: number;
  assists: number;
}

export interface SeasonStatsTotals {
  matches: number;
  goals: number;
  assists: number;
}

/** Agrège les deltas de feuille match vers les stats saison. */
export function aggregateSeasonStats(
  previous: SeasonStatsTotals | undefined,
  delta: SeasonStatsDelta,
): SeasonStatsTotals {
  const prev = previous ?? { matches: 0, goals: 0, assists: 0 };
  return {
    matches: prev.matches + delta.matches,
    goals: prev.goals + delta.goals,
    assists: prev.assists + delta.assists,
  };
}

/** Calcule le delta saison pour une feuille individuelle (1 match comptabilisé). */
export function seasonDeltaFromMatchSheet(sheet: PlayerMatchSheetStat): SeasonStatsDelta {
  return {
    matches: 1,
    goals: sheet.goals ?? 0,
    assists: sheet.assists ?? 0,
  };
}

/** UIDs éligibles à l'agrégation saison depuis la feuille de match. */
export function collectMatchSheetPlayerUids(event: TeamEvent): string[] {
  return Object.keys(event.player_match_stats ?? {});
}

/** Agrège live_actions vers des feuilles joueur (import coach). */
export function importLiveActionsToMatchSheet(
  event: TeamEvent,
): Record<string, PlayerMatchSheetStat> {
  const sheets: Record<string, PlayerMatchSheetStat> = {
    ...(event.player_match_stats ?? {}),
  };

  for (const action of event.live_actions ?? []) {
    const current = sheets[action.player_uid] ?? {
      uid: action.player_uid,
      player_name: action.player_name,
    };

    if (action.type === 'goal') {
      current.goals = (current.goals ?? 0) + 1;
    }
    if (action.type === 'assist') {
      current.assists = (current.assists ?? 0) + 1;
    }
    if (action.type === 'yellow_card') {
      current.yellow_cards = (current.yellow_cards ?? 0) + 1;
    }
    if (action.type === 'red_card') {
      current.red_cards = (current.red_cards ?? 0) + 1;
    }

    sheets[action.player_uid] = current;
  }

  return sheets;
}

/** Totaux buts/passes depuis le live (fallback legacy). */
export function tallyLiveActionStats(
  actions: LiveMatchAction[],
): Record<string, { goals: number; assists: number }> {
  const tallies: Record<string, { goals: number; assists: number }> = {};
  for (const action of actions) {
    if (!tallies[action.player_uid]) tallies[action.player_uid] = { goals: 0, assists: 0 };
    if (action.type === 'goal') tallies[action.player_uid].goals += 1;
    if (action.type === 'assist') tallies[action.player_uid].assists += 1;
  }
  return tallies;
}

/** Indique si l'événement peut propager les stats saison. */
export function canApplySeasonStats(event: TeamEvent): boolean {
  return Boolean(event.match_report_finalized_at) && !event.stats_applied_at;
}
