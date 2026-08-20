import type {
  ExternalCompetitionId,
  ExternalFixture,
  ExternalFixtureStatus,
  ListTeamFixturesOptions,
} from '../services/externalScores.types';
import { SUPPORTER_POPULAR_CLUBS } from './supporterPopularClubs';

type DemoMatchSeed = {
  id: string;
  competition: ExternalCompetitionId;
  competition_label: string;
  league_id: number;
  homeTeamId: number;
  awayTeamId: number;
  daysFromNow: number;
  hour: number;
  minute?: number;
  status?: ExternalFixtureStatus;
  score_home?: number;
  score_away?: number;
  liveMinute?: number;
};

/** Nom court affiché dans les cartes (aligné mock / API). */
function displayNameForTeamId(teamId: number): string {
  const club = SUPPORTER_POPULAR_CLUBS.find((row) => row.apiTeamId === teamId);
  if (!club) return `Équipe ${teamId}`;
  const alias = club.aliases?.find((a) => a.length <= 12);
  return alias ?? club.name;
}

function addDays(base: Date, days: number, hour: number, minute = 0): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const DEMO_MATCH_SEEDS: DemoMatchSeed[] = [
  {
    id: 'demo_psg_om',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    league_id: 61,
    homeTeamId: 85,
    awayTeamId: 81,
    daysFromNow: 2,
    hour: 21,
  },
  {
    id: 'demo_psg_ol',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    league_id: 61,
    homeTeamId: 85,
    awayTeamId: 80,
    daysFromNow: 5,
    hour: 19,
  },
  {
    id: 'demo_psg_monaco',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    league_id: 61,
    homeTeamId: 91,
    awayTeamId: 85,
    daysFromNow: 9,
    hour: 17,
  },
  {
    id: 'demo_psg_ucl',
    competition: 'ucl',
    competition_label: 'UEFA Champions League',
    league_id: 2,
    homeTeamId: 85,
    awayTeamId: 541,
    daysFromNow: 11,
    hour: 21,
  },
  {
    id: 'demo_psg_friendly',
    competition: 'other',
    competition_label: 'Match amical',
    league_id: 0,
    homeTeamId: 85,
    awayTeamId: 529,
    daysFromNow: 13,
    hour: 18,
  },
  {
    id: 'demo_om_nice',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    league_id: 61,
    homeTeamId: 81,
    awayTeamId: 84,
    daysFromNow: 3,
    hour: 20,
  },
  {
    id: 'demo_om_lens',
    competition: 'ligue1',
    competition_label: 'Ligue 1',
    league_id: 61,
    homeTeamId: 116,
    awayTeamId: 81,
    daysFromNow: 7,
    hour: 19,
  },
  {
    id: 'demo_real_barca',
    competition: 'laliga',
    competition_label: 'La Liga',
    league_id: 140,
    homeTeamId: 541,
    awayTeamId: 529,
    daysFromNow: 4,
    hour: 21,
  },
  {
    id: 'demo_real_atleti',
    competition: 'laliga',
    competition_label: 'La Liga',
    league_id: 140,
    homeTeamId: 541,
    awayTeamId: 530,
    daysFromNow: 8,
    hour: 16,
  },
  {
    id: 'demo_real_ucl',
    competition: 'ucl',
    competition_label: 'UEFA Champions League',
    league_id: 2,
    homeTeamId: 541,
    awayTeamId: 50,
    daysFromNow: 12,
    hour: 21,
  },
  {
    id: 'demo_barca_sevilla',
    competition: 'laliga',
    competition_label: 'La Liga',
    league_id: 140,
    homeTeamId: 529,
    awayTeamId: 536,
    daysFromNow: 6,
    hour: 18,
  },
  {
    id: 'demo_barca_ucl',
    competition: 'ucl',
    competition_label: 'UEFA Champions League',
    league_id: 2,
    homeTeamId: 529,
    awayTeamId: 33,
    daysFromNow: 10,
    hour: 21,
  },
];

/** Fixtures démo avec dates relatives à `now` — utilisées sans clé API. */
export function buildSupporterDemoFixtures(now: Date = new Date()): ExternalFixture[] {
  return DEMO_MATCH_SEEDS.map((seed) => {
    const status = seed.status ?? 'scheduled';
    return {
      id: seed.id,
      competition: seed.competition,
      competition_label: seed.competition_label,
      league_id: seed.league_id || undefined,
      home_team: displayNameForTeamId(seed.homeTeamId),
      away_team: displayNameForTeamId(seed.awayTeamId),
      home_team_id: seed.homeTeamId,
      away_team_id: seed.awayTeamId,
      starts_at: addDays(now, seed.daysFromNow, seed.hour, seed.minute ?? 0),
      status,
      score_home: seed.score_home,
      score_away: seed.score_away,
      minute: seed.liveMinute,
    };
  });
}

function cloneFixture(fixture: ExternalFixture): ExternalFixture {
  return { ...fixture, starts_at: new Date(fixture.starts_at) };
}

/** Filtre les fixtures démo pour une équipe suivie (stub / beta sans clé). */
export function listDemoTeamFixtures(
  teamId: number,
  options?: ListTeamFixturesOptions,
  now: Date = new Date(),
): ExternalFixture[] {
  const status = options?.status ?? 'scheduled';
  const days = options?.days ?? 14;
  const next = options?.next ?? 15;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + days);

  return buildSupporterDemoFixtures(now)
    .filter((fixture) => {
      const touchesTeam =
        fixture.home_team_id === teamId || fixture.away_team_id === teamId;
      if (!touchesTeam) return false;
      if (fixture.status !== status) return false;
      if (status === 'scheduled' && fixture.starts_at > cutoff) return false;
      if (status === 'scheduled' && fixture.starts_at.getTime() < now.getTime()) return false;
      return true;
    })
    .slice(0, next)
    .map(cloneFixture)
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
}
