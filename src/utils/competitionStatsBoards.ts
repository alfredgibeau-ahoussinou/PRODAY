import type { PlayerCompetitionStats } from '../models/Competition';

export interface CompetitionLeaderboards {
  scorers: PlayerCompetitionStats[];
  assists: PlayerCompetitionStats[];
  cleanSheets: PlayerCompetitionStats[];
  discipline: PlayerCompetitionStats[];
  minutes: PlayerCompetitionStats[];
}

export function buildCompetitionLeaderboards(
  stats: PlayerCompetitionStats[],
  limit = 10,
): CompetitionLeaderboards {
  const by = (
    key: keyof PlayerCompetitionStats,
    secondary?: keyof PlayerCompetitionStats,
  ) =>
    [...stats]
      .sort((a, b) => {
        const diff = Number(b[key]) - Number(a[key]);
        if (diff !== 0) return diff;
        if (secondary) return Number(b[secondary]) - Number(a[secondary]);
        return a.display_name.localeCompare(b.display_name, 'fr');
      })
      .filter((row) => Number(row[key]) > 0)
      .slice(0, limit);

  return {
    scorers: by('goals', 'assists'),
    assists: by('assists', 'goals'),
    cleanSheets: by('clean_sheets', 'minutes'),
    discipline: [...stats]
      .map((s) => ({
        ...s,
        // sort key via yellow+red*2 for severity
      }))
      .sort((a, b) => {
        const scoreA = a.yellow_cards + a.red_cards * 3;
        const scoreB = b.yellow_cards + b.red_cards * 3;
        return scoreB - scoreA;
      })
      .filter((s) => s.yellow_cards + s.red_cards > 0)
      .slice(0, limit),
    minutes: by('minutes', 'matches'),
  };
}

export function averageRating(row: PlayerCompetitionStats): number | null {
  if (!row.rating_count) return null;
  return Math.round((row.rating_sum / row.rating_count) * 10) / 10;
}

export interface TeamSeasonAnalytics {
  team_id: string;
  display_name: string;
  points: number;
  played: number;
  goal_difference: number;
  win_rate: number;
  form_label: string;
}

export function buildTeamSeasonAnalytics(
  rows: {
    team_id: string;
    display_name: string;
    points: number;
    played: number;
    won: number;
    goal_difference: number;
  }[],
): TeamSeasonAnalytics[] {
  return rows.map((r) => ({
    team_id: r.team_id,
    display_name: r.display_name,
    points: r.points,
    played: r.played,
    goal_difference: r.goal_difference,
    win_rate: r.played > 0 ? Math.round((r.won / r.played) * 100) : 0,
    form_label:
      r.played === 0
        ? '—'
        : r.won / Math.max(r.played, 1) >= 0.6
          ? 'En forme'
          : r.won / Math.max(r.played, 1) <= 0.25
            ? 'En difficulté'
            : 'Stable',
  }));
}
