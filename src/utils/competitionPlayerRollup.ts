import type { PlayerCompetitionStats } from '../models/Competition';
import type { PlayerMatchSheetStat } from '../models/TeamEvent';

export function rollupPlayerCompetitionStats(input: {
  seasonId: string;
  competitionId: string;
  sheetStats: PlayerMatchSheetStat[];
  existing: PlayerCompetitionStats[];
  homeCleanSheet?: boolean;
  awayCleanSheet?: boolean;
  potmUid?: string;
}): Omit<PlayerCompetitionStats, 'id' | 'season_id' | 'competition_id' | 'updated_at'>[] {
  const map = new Map<
    string,
    Omit<PlayerCompetitionStats, 'id' | 'season_id' | 'competition_id' | 'updated_at'>
  >();

  for (const row of input.existing) {
    map.set(row.uid, {
      uid: row.uid,
      display_name: row.display_name,
      team_id: row.team_id,
      matches: row.matches,
      minutes: row.minutes,
      goals: row.goals,
      assists: row.assists,
      clean_sheets: row.clean_sheets,
      yellow_cards: row.yellow_cards,
      red_cards: row.red_cards,
      rating_sum: row.rating_sum,
      rating_count: row.rating_count,
      motm: row.motm,
    });
  }

  for (const stat of input.sheetStats) {
    const cur = map.get(stat.uid) ?? {
      uid: stat.uid,
      display_name: stat.player_name,
      team_id: null,
      matches: 0,
      minutes: 0,
      goals: 0,
      assists: 0,
      clean_sheets: 0,
      yellow_cards: 0,
      red_cards: 0,
      rating_sum: 0,
      rating_count: 0,
      motm: 0,
    };
    cur.matches += 1;
    cur.minutes += stat.minutes_played ?? 0;
    cur.goals += stat.goals ?? 0;
    cur.assists += stat.assists ?? 0;
    cur.yellow_cards += stat.yellow_cards ?? 0;
    cur.red_cards += stat.red_cards ?? 0;
    if (typeof stat.rating === 'number') {
      cur.rating_sum += stat.rating;
      cur.rating_count += 1;
    }
    if (input.potmUid && stat.uid === input.potmUid) {
      cur.motm += 1;
    }
    // Clean sheets attributed when player played 60+ min and team kept a clean sheet
    // (home/away not known per player here — attribute if either side CS and minutes >= 60)
    if (
      (stat.minutes_played ?? 0) >= 60 &&
      (input.homeCleanSheet || input.awayCleanSheet)
    ) {
      cur.clean_sheets += 1;
    }
    cur.display_name = stat.player_name || cur.display_name;
    map.set(stat.uid, cur);
  }

  return [...map.values()];
}
