import type {
  CompetitionFixture,
  CompetitionRules,
  CompetitionStandingRow,
  CompetitionTeam,
} from '../models/Competition';

export type ScheduleSeedFixture = Omit<
  CompetitionFixture,
  | 'id'
  | 'status'
  | 'home_score'
  | 'away_score'
  | 'team_event_id'
  | 'validated_at'
  | 'validated_by'
  | 'contested_at'
  | 'contested_by'
  | 'contest_reason'
  | 'contest_deadline_at'
  | 'auto_potm_uid'
  | 'auto_potm_name'
  | 'ai_summary'
  | 'highlight_urls'
  | 'external_fixture_id'
  | 'created_at'
  | 'updated_at'
> & {
  status: 'scheduled';
  home_score: null;
  away_score: null;
  source: 'proday';
};

type Rules = Pick<CompetitionRules, 'points_win' | 'points_draw' | 'points_loss'>;

const DEFAULT_RULES: Rules = {
  points_win: 3,
  points_draw: 1,
  points_loss: 0,
};

/** Round-robin (single) or home-and-away schedule. */
export function buildCompetitionSchedule(
  seasonId: string,
  competitionId: string,
  teams: CompetitionTeam[],
  mode: 'round_robin' | 'home_away',
  seasonStart: Date,
): ScheduleSeedFixture[] {
  if (teams.length < 2) return [];

  const pairs: { home: CompetitionTeam; away: CompetitionTeam }[] = [];
  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      pairs.push({ home: teams[i], away: teams[j] });
      if (mode === 'home_away') {
        pairs.push({ home: teams[j], away: teams[i] });
      }
    }
  }

  // Greedy matchday packing: fixtures that don't share a team
  const remaining = [...pairs];
  const matchdays: { home: CompetitionTeam; away: CompetitionTeam }[][] = [];
  while (remaining.length > 0) {
    const day: { home: CompetitionTeam; away: CompetitionTeam }[] = [];
    const used = new Set<string>();
    for (let i = 0; i < remaining.length; ) {
      const p = remaining[i];
      if (!used.has(p.home.id) && !used.has(p.away.id)) {
        day.push(p);
        used.add(p.home.id);
        used.add(p.away.id);
        remaining.splice(i, 1);
      } else {
        i += 1;
      }
    }
    if (day.length === 0) {
      // Fallback: take one to avoid infinite loop on odd graphs
      day.push(remaining.shift()!);
    }
    matchdays.push(day);
  }

  const fixtures: ScheduleSeedFixture[] = [];
  matchdays.forEach((day, mdIndex) => {
    const kickoff = new Date(seasonStart);
    kickoff.setDate(kickoff.getDate() + mdIndex * 7);
    kickoff.setHours(15, 0, 0, 0);
    day.forEach((p) => {
      fixtures.push({
        season_id: seasonId,
        competition_id: competitionId,
        matchday: mdIndex + 1,
        home_team_id: p.home.id,
        away_team_id: p.away.id,
        home_name: p.home.display_name,
        away_name: p.away.display_name,
        kickoff_at: kickoff,
        status: 'scheduled',
        home_score: null,
        away_score: null,
        source: 'proday',
      });
    });
  });

  return fixtures;
}

export function computeCompetitionStandings(
  teams: CompetitionTeam[],
  fixtures: CompetitionFixture[],
  rules: Rules = DEFAULT_RULES,
): CompetitionStandingRow[] {
  const rows = new Map<string, CompetitionStandingRow>();

  for (const team of teams) {
    rows.set(team.id, {
      team_id: team.id,
      display_name: team.display_name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
    });
  }

  for (const fixture of fixtures) {
    // Contested fixtures freeze standings contribution until resolved
    if (fixture.status === 'contested' || fixture.status === 'void') continue;
    if (fixture.status !== 'validated') continue;
    if (fixture.home_score == null || fixture.away_score == null) continue;

    const home = rows.get(fixture.home_team_id);
    const away = rows.get(fixture.away_team_id);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goals_for += fixture.home_score;
    home.goals_against += fixture.away_score;
    away.goals_for += fixture.away_score;
    away.goals_against += fixture.home_score;

    if (fixture.home_score > fixture.away_score) {
      home.won += 1;
      home.points += rules.points_win;
      away.lost += 1;
      away.points += rules.points_loss;
    } else if (fixture.home_score < fixture.away_score) {
      away.won += 1;
      away.points += rules.points_win;
      home.lost += 1;
      home.points += rules.points_loss;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += rules.points_draw;
      away.points += rules.points_draw;
    }
  }

  for (const row of rows.values()) {
    row.goal_difference = row.goals_for - row.goals_against;
  }

  return [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return a.display_name.localeCompare(b.display_name, 'fr');
  });
}

export function isContestWindowOpen(
  fixture: Pick<CompetitionFixture, 'validated_at' | 'contest_deadline_at' | 'status'>,
  now = new Date(),
): boolean {
  if (fixture.status !== 'validated') return false;
  if (fixture.contest_deadline_at) return now.getTime() <= fixture.contest_deadline_at.getTime();
  if (!fixture.validated_at) return false;
  return now.getTime() - fixture.validated_at.getTime() <= 48 * 60 * 60 * 1000;
}
