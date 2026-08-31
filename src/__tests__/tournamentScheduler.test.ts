import {
  generateGroups,
  generateGroupSchedule,
  generateKnockoutBracket,
  reschedule,
  extractQualifiedTeams,
  generateFullTournamentPlan,
  type ScheduleOptions,
} from '../utils/tournamentScheduler';

function makeTeams(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: `t${i + 1}`, name: `Équipe ${i + 1}` }));
}

const baseOpts: ScheduleOptions = {
  fields: 2,
  matchDurationMin: 10,
  breakMin: 5,
  startTime: new Date('2026-09-01T09:00:00'),
};

describe('generateGroups', () => {
  it('répartit 8 équipes en 2 poules de 4', () => {
    const { groups, teamPool } = generateGroups(makeTeams(8), 2);
    expect(groups).toHaveLength(2);
    expect(groups[0].teamIds).toHaveLength(4);
    expect(groups[1].teamIds).toHaveLength(4);
    expect(teamPool).toHaveLength(8);
  });

  it('gère un groupCount supérieur au nombre de paires possibles', () => {
    const { groups } = generateGroups(makeTeams(4), 10);
    expect(groups.length).toBeLessThanOrEqual(2);
    groups.forEach((g) => expect(g.teamIds.length).toBeGreaterThanOrEqual(2));
  });

  it('répartit les équipes en snake draft', () => {
    const { groups } = generateGroups(makeTeams(6), 2);
    expect(groups[0].teamIds).toContain('t1');
    expect(groups[1].teamIds).toContain('t2');
    expect(groups[0].teamIds).toContain('t3');
  });
});

describe('generateGroupSchedule', () => {
  it('génère les bons matchs de poule (round robin)', () => {
    const { groups } = generateGroups(makeTeams(4), 1);
    const teamMap = new Map(makeTeams(4).map((t) => [t.id, t.name]));
    const { fixtures } = generateGroupSchedule(groups, teamMap, baseOpts);
    // 4 teams in 1 pool = C(4,2) = 6 matchs
    expect(fixtures).toHaveLength(6);
    expect(fixtures.every((f) => f.phase === 'pool')).toBe(true);
  });

  it('attribue des terrains et des horaires distincts', () => {
    const { groups } = generateGroups(makeTeams(6), 2);
    const teamMap = new Map(makeTeams(6).map((t) => [t.id, t.name]));
    const { fixtures } = generateGroupSchedule(groups, teamMap, baseOpts);

    const slots = fixtures.map((f) => `${f.startsAt.toISOString()}_${f.pitchIndex}`);
    const unique = new Set(slots);
    expect(unique.size).toBe(fixtures.length);
  });

  it('respecte la durée et la pause entre matchs', () => {
    const { groups } = generateGroups(makeTeams(4), 1);
    const teamMap = new Map(makeTeams(4).map((t) => [t.id, t.name]));
    const opts: ScheduleOptions = { ...baseOpts, fields: 1 };
    const { fixtures } = generateGroupSchedule(groups, teamMap, opts);

    for (let i = 1; i < fixtures.length; i++) {
      const gap = fixtures[i].startsAt.getTime() - fixtures[i - 1].startsAt.getTime();
      expect(gap).toBe((10 + 5) * 60_000);
    }
  });
});

describe('generateKnockoutBracket', () => {
  it('génère un bracket simple pour 4 équipes', () => {
    const teams = makeTeams(4);
    const { fixtures } = generateKnockoutBracket(teams, baseOpts);
    // 4 teams: 2 demi + 1 finale = bracket ne génère que les demis (les gagnants sont inconnus)
    expect(fixtures.length).toBe(2);
    expect(fixtures[0].roundLabel).toContain('Demi');
  });

  it('gère les BYE (nombre non puissance de 2)', () => {
    const teams = makeTeams(3);
    const { fixtures } = generateKnockoutBracket(teams, baseOpts);
    // 3 teams → padded to 4 → 1 BYE → only 1 real match in round 1
    expect(fixtures.length).toBeGreaterThanOrEqual(1);
  });

  it('retourne un warning si < 2 équipes', () => {
    const { fixtures, warnings } = generateKnockoutBracket([makeTeams(1)[0]], baseOpts);
    expect(fixtures).toHaveLength(0);
    expect(warnings.length).toBeGreaterThan(0);
  });
});

describe('reschedule', () => {
  it('décale les matchs du même terrain', () => {
    const { groups } = generateGroups(makeTeams(4), 1);
    const teamMap = new Map(makeTeams(4).map((t) => [t.id, t.name]));
    const { fixtures } = generateGroupSchedule(groups, teamMap, { ...baseOpts, fields: 1 });

    const result = reschedule(fixtures, fixtures[1].id, 10);
    expect(result.affectedCount).toBe(fixtures.length - 1);

    const delayMs = 10 * 60_000;
    expect(result.updated[1].startsAt.getTime()).toBe(fixtures[1].startsAt.getTime() + delayMs);
    expect(result.updated[0].startsAt.getTime()).toBe(fixtures[0].startsAt.getTime());
  });

  it('retourne summary lisible', () => {
    const { groups } = generateGroups(makeTeams(4), 1);
    const teamMap = new Map(makeTeams(4).map((t) => [t.id, t.name]));
    const { fixtures } = generateGroupSchedule(groups, teamMap, baseOpts);
    const result = reschedule(fixtures, fixtures[0].id, 15);
    expect(result.summary).toContain('15 min');
  });

  it('retourne un message si match introuvable', () => {
    const result = reschedule([], 'nope', 5);
    expect(result.affectedCount).toBe(0);
    expect(result.summary).toContain('introuvable');
  });

  it('peut décaler tous les terrains', () => {
    const { groups } = generateGroups(makeTeams(4), 1);
    const teamMap = new Map(makeTeams(4).map((t) => [t.id, t.name]));
    const { fixtures } = generateGroupSchedule(groups, teamMap, baseOpts);

    const result = reschedule(fixtures, fixtures[0].id, 5, true);
    expect(result.affectedCount).toBe(fixtures.length);
  });
});

describe('extractQualifiedTeams', () => {
  it('extrait les N premiers de chaque poule ordonnés pour le seeding', () => {
    const standings = {
      pool_1: [
        { teamId: 'a1', name: '1A', pts: 9, gf: 5, ga: 1 },
        { teamId: 'a2', name: '2A', pts: 3, gf: 2, ga: 4 },
      ],
      pool_2: [
        { teamId: 'b1', name: '1B', pts: 7, gf: 4, ga: 2 },
        { teamId: 'b2', name: '2B', pts: 4, gf: 3, ga: 3 },
      ],
    };
    const qualified = extractQualifiedTeams(standings, 2);
    expect(qualified.map((q) => q.id)).toEqual(['a1', 'b1', 'a2', 'b2']);
  });
});

describe('generateFullTournamentPlan', () => {
  it('génère un plan complet pools_then_knockout', () => {
    const plan = generateFullTournamentPlan({
      name: 'Tournoi test',
      category: 'U13',
      teams: makeTeams(8),
      groupCount: 2,
      format: 'pools_then_knockout',
      fields: 2,
      matchDurationMin: 10,
      breakMin: 3,
      startTime: new Date('2026-09-01T09:00:00'),
    });
    expect(plan.groups).toHaveLength(2);
    expect(plan.poolFixtures.length).toBeGreaterThan(0);
    expect(plan.knockoutFixtures.length).toBeGreaterThan(0);
    expect(plan.allFixtures.length).toBe(plan.poolFixtures.length + plan.knockoutFixtures.length);
  });

  it('génère un plan direct_elimination sans poules', () => {
    const plan = generateFullTournamentPlan({
      name: 'Direct',
      category: 'Senior',
      teams: makeTeams(4),
      groupCount: 1,
      format: 'direct_elimination',
      fields: 1,
      matchDurationMin: 15,
      breakMin: 5,
      startTime: new Date('2026-09-01T10:00:00'),
    });
    expect(plan.groups).toHaveLength(0);
    expect(plan.poolFixtures).toHaveLength(0);
    expect(plan.knockoutFixtures.length).toBeGreaterThan(0);
  });

  it('génère un plan pools_only sans knockout', () => {
    const plan = generateFullTournamentPlan({
      name: 'Poules',
      category: 'U15',
      teams: makeTeams(6),
      groupCount: 2,
      format: 'pools_only',
      fields: 2,
      matchDurationMin: 10,
      breakMin: 3,
      startTime: new Date('2026-09-01T09:00:00'),
    });
    expect(plan.groups).toHaveLength(2);
    expect(plan.poolFixtures.length).toBeGreaterThan(0);
    expect(plan.knockoutFixtures).toHaveLength(0);
  });
});
