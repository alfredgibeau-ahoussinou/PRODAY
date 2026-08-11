import type { PlayerMatchSheetStat } from '../models/TeamEvent';

export function computeAutoPotm(
  sheetStats: Record<string, PlayerMatchSheetStat>,
): { uid: string; name: string; score: number } | null {
  let best: { uid: string; name: string; score: number } | null = null;
  for (const stat of Object.values(sheetStats)) {
    const goals = stat.goals ?? 0;
    const assists = stat.assists ?? 0;
    const rating = stat.rating ?? 6;
    const minutes = stat.minutes_played ?? 0;
    // Weights: goals, assists, rating, minutes
    const score = goals * 3 + assists * 2 + rating + minutes / 90;
    if (!best || score > best.score) {
      best = { uid: stat.uid, name: stat.player_name, score };
    }
  }
  return best;
}
