import type {
  PoolStandingRow,
  TournamentFixture,
  TournamentPool,
  TournamentRegistration,
} from '../models/Tournament';

export function chunkRegistrationsIntoPools(
  registrations: TournamentRegistration[],
  poolSize = 4
): TournamentPool[] {
  if (registrations.length < 2) return [];
  const size = Math.min(poolSize, Math.max(3, registrations.length));
  const pools: TournamentPool[] = [];
  let index = 0;
  let poolNum = 0;
  while (index < registrations.length) {
    const slice = registrations.slice(index, index + size);
    if (slice.length < 2 && pools.length > 0) {
      pools[pools.length - 1].registration_ids.push(...slice.map((r) => r.id));
      break;
    }
    pools.push({
      id: `pool-${poolNum + 1}`,
      name: `Poule ${String.fromCharCode(65 + poolNum)}`,
      registration_ids: slice.map((r) => r.id),
    });
    index += size;
    poolNum += 1;
  }
  return pools;
}

export function buildRoundRobinFixtures(
  pool: TournamentPool,
  registrations: TournamentRegistration[]
): TournamentFixture[] {
  const teams = pool.registration_ids
    .map((id) => registrations.find((r) => r.id === id))
    .filter((r): r is TournamentRegistration => Boolean(r));

  const fixtures: TournamentFixture[] = [];
  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      const home = teams[i];
      const away = teams[j];
      fixtures.push({
        id: `${pool.id}-${home.id}-${away.id}`,
        pool_id: pool.id,
        home_registration_id: home.id,
        away_registration_id: away.id,
        home_name: home.club_name,
        away_name: away.club_name,
        home_score: null,
        away_score: null,
        played: false,
      });
    }
  }
  return fixtures;
}

export function computePoolStandings(
  pool: TournamentPool,
  registrations: TournamentRegistration[],
  fixtures: TournamentFixture[]
): PoolStandingRow[] {
  const rows = new Map<string, PoolStandingRow>();

  for (const regId of pool.registration_ids) {
    const reg = registrations.find((r) => r.id === regId);
    if (!reg) continue;
    rows.set(regId, {
      registration_id: regId,
      club_name: reg.club_name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      points: 0,
    });
  }

  for (const fixture of fixtures) {
    if (fixture.pool_id !== pool.id || !fixture.played) continue;
    if (fixture.home_score == null || fixture.away_score == null) continue;

    const home = rows.get(fixture.home_registration_id);
    const away = rows.get(fixture.away_registration_id);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goals_for += fixture.home_score;
    home.goals_against += fixture.away_score;
    away.goals_for += fixture.away_score;
    away.goals_against += fixture.home_score;

    if (fixture.home_score > fixture.away_score) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (fixture.home_score < fixture.away_score) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = a.goals_for - a.goals_against;
    const diffB = b.goals_for - b.goals_against;
    if (diffB !== diffA) return diffB - diffA;
    return b.goals_for - a.goals_for;
  });
}

export function computeAllStandings(
  pools: TournamentPool[],
  registrations: TournamentRegistration[],
  fixtures: TournamentFixture[]
): Record<string, PoolStandingRow[]> {
  const standings: Record<string, PoolStandingRow[]> = {};
  for (const pool of pools) {
    standings[pool.id] = computePoolStandings(pool, registrations, fixtures);
  }
  return standings;
}
