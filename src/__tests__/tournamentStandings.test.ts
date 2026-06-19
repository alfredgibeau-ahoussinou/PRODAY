import {
  buildRoundRobinFixtures,
  chunkRegistrationsIntoPools,
  computePoolStandings,
} from '../utils/tournamentStandings';
import type { TournamentRegistration } from '../models/Tournament';

const regs = (clubs: string[]): TournamentRegistration[] =>
  clubs.map((club, i) => ({
    id: `r${i}`,
    club_id: `c${i}`,
    club_name: club,
    captain_uid: `u${i}`,
    captain_name: `Cap ${i}`,
    player_uids: [],
    player_names: [],
    paid: true,
    registered_at: new Date(),
  }));

describe('tournamentStandings', () => {
  it('crée des poules à partir des inscriptions', () => {
    const pools = chunkRegistrationsIntoPools(regs(['A', 'B', 'C', 'D', 'E']));
    expect(pools.length).toBeGreaterThan(0);
    expect(pools[0].registration_ids.length).toBeGreaterThanOrEqual(2);
  });

  it('génère des matchs toutes rondes', () => {
    const registrations = regs(['A', 'B', 'C']);
    const pool = { id: 'p1', name: 'Poule A', registration_ids: registrations.map((r) => r.id) };
    const fixtures = buildRoundRobinFixtures(pool, registrations);
    expect(fixtures).toHaveLength(3);
  });

  it('calcule le classement', () => {
    const registrations = regs(['A', 'B']);
    const pool = { id: 'p1', name: 'Poule A', registration_ids: registrations.map((r) => r.id) };
    const fixtures = buildRoundRobinFixtures(pool, registrations).map((f) => ({
      ...f,
      played: true,
      home_score: 2,
      away_score: 1,
    }));
    const standings = computePoolStandings(pool, registrations, fixtures);
    expect(standings[0].points).toBe(3);
    expect(standings[0].won).toBe(1);
  });
});
