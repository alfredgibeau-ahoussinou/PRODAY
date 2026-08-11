import {
  buildCompetitionSchedule,
  computeCompetitionStandings,
  isContestWindowOpen,
} from '../utils/competitionStandings';
import type { CompetitionFixture, CompetitionTeam } from '../models/Competition';

function team(id: string, name: string): CompetitionTeam {
  return {
    id,
    season_id: 's1',
    competition_id: 'c1',
    club_id: `club_${id}`,
    display_name: name,
    created_at: new Date(),
  };
}

function fixture(
  partial: Partial<CompetitionFixture> & {
    home_team_id: string;
    away_team_id: string;
    home_score: number | null;
    away_score: number | null;
    status: CompetitionFixture['status'];
  },
): CompetitionFixture {
  return {
    id: partial.id ?? `${partial.home_team_id}-${partial.away_team_id}`,
    season_id: 's1',
    competition_id: 'c1',
    matchday: partial.matchday ?? 1,
    home_team_id: partial.home_team_id,
    away_team_id: partial.away_team_id,
    home_name: partial.home_name ?? 'Home',
    away_name: partial.away_name ?? 'Away',
    kickoff_at: partial.kickoff_at ?? new Date(),
    status: partial.status,
    home_score: partial.home_score,
    away_score: partial.away_score,
    source: partial.source ?? 'proday',
    validated_at: partial.validated_at,
    contest_deadline_at: partial.contest_deadline_at,
    created_at: partial.created_at ?? new Date(),
    updated_at: partial.updated_at ?? new Date(),
  };
}

describe('competitionStandings', () => {
  const teams = [team('t1', 'Alpha'), team('t2', 'Bravo'), team('t3', 'Charlie')];

  it('génère un calendrier round-robin', () => {
    const schedule = buildCompetitionSchedule('s1', 'c1', teams, 'round_robin', new Date('2026-09-01'));
    expect(schedule).toHaveLength(3);
    expect(schedule.every((f) => f.status === 'scheduled')).toBe(true);
  });

  it('génère un calendrier aller-retour', () => {
    const schedule = buildCompetitionSchedule('s1', 'c1', teams, 'home_away', new Date('2026-09-01'));
    expect(schedule).toHaveLength(6);
  });

  it('calcule le classement (3-1-0)', () => {
    const fixtures = [
      fixture({
        home_team_id: 't1',
        away_team_id: 't2',
        home_score: 2,
        away_score: 1,
        status: 'validated',
      }),
      fixture({
        home_team_id: 't1',
        away_team_id: 't3',
        home_score: 1,
        away_score: 1,
        status: 'validated',
      }),
    ];
    const rows = computeCompetitionStandings(teams, fixtures);
    expect(rows[0].team_id).toBe('t1');
    expect(rows[0].points).toBe(4);
    expect(rows[0].won).toBe(1);
    expect(rows[0].drawn).toBe(1);
  });

  it('exclut les matchs contestés du classement (freeze)', () => {
    const fixtures = [
      fixture({
        home_team_id: 't1',
        away_team_id: 't2',
        home_score: 3,
        away_score: 0,
        status: 'contested',
      }),
      fixture({
        home_team_id: 't2',
        away_team_id: 't3',
        home_score: 1,
        away_score: 0,
        status: 'validated',
      }),
    ];
    const rows = computeCompetitionStandings(teams, fixtures);
    const alpha = rows.find((r) => r.team_id === 't1');
    const bravo = rows.find((r) => r.team_id === 't2');
    expect(alpha?.played).toBe(0);
    expect(bravo?.points).toBe(3);
  });

  it('ouvre la fenêtre de contestation 48h', () => {
    const now = new Date('2026-08-05T12:00:00Z');
    const open = isContestWindowOpen(
      {
        status: 'validated',
        validated_at: new Date('2026-08-04T12:00:00Z'),
        contest_deadline_at: new Date('2026-08-06T12:00:00Z'),
      },
      now,
    );
    const closed = isContestWindowOpen(
      {
        status: 'validated',
        validated_at: new Date('2026-08-01T12:00:00Z'),
        contest_deadline_at: new Date('2026-08-03T12:00:00Z'),
      },
      now,
    );
    expect(open).toBe(true);
    expect(closed).toBe(false);
  });
});
