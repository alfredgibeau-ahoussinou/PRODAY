/**
 * tournamentScheduler — façade pure-function pour la Phase 6.
 *
 * Réexporte et étend clubTournamentGenerator avec :
 *   - generateGroups / generateGroupSchedule / generateKnockoutBracket / reschedule
 *   - Format "direct_elimination" (élimination directe sans poules)
 *   - Génération automatique du bracket à partir des classements de poules
 */

import type {
  ClubTournamentFormat,
  ClubTournamentSetupInput,
  GeneratedTournamentFixture,
  GeneratedTournamentPlan,
  GeneratedTournamentTeam,
} from './clubTournamentGenerator';

export type { ClubTournamentFormat, ClubTournamentSetupInput, GeneratedTournamentFixture, GeneratedTournamentPlan, GeneratedTournamentTeam };

export type TournamentFormat = ClubTournamentFormat | 'direct_elimination';

// ── helpers ──────────────────────────────────────────────────────────

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

// ── 1. Génération de poules ─────────────────────────────────────────

export interface GroupDef {
  id: string;
  name: string;
  teamIds: string[];
}

/**
 * Répartit `teams` en `groupCount` poules de manière équilibrée (snake draft).
 */
export function generateGroups(
  teams: { id: string; name: string }[],
  groupCount: number,
): { groups: GroupDef[]; teamPool: GeneratedTournamentTeam[] } {
  const gc = Math.max(1, Math.min(groupCount, Math.floor(teams.length / 2) || 1));
  const groups: GroupDef[] = Array.from({ length: gc }, (_, i) => ({
    id: `pool_${i + 1}`,
    name: `Poule ${String.fromCharCode(65 + i)}`,
    teamIds: [],
  }));

  const teamPool: GeneratedTournamentTeam[] = [];

  teams.forEach((t, i) => {
    const gi = i % gc;
    groups[gi].teamIds.push(t.id);
    teamPool.push({ id: t.id, name: t.name, poolId: groups[gi].id });
  });

  return { groups, teamPool };
}

// ── 2. Calendrier des matchs de poule ───────────────────────────────

export interface ScheduleOptions {
  fields: number;
  matchDurationMin: number;
  breakMin: number;
  startTime: Date;
}

/**
 * Génère le calendrier complet des matchs de poule (round-robin intra-poule),
 * avec attribution de terrain et créneaux horaires.
 */
export function generateGroupSchedule(
  groups: GroupDef[],
  teamMap: Map<string, string>,
  options: ScheduleOptions,
): { fixtures: GeneratedTournamentFixture[]; warnings: string[] } {
  const { fields, matchDurationMin, breakMin, startTime } = options;
  const slotMs = (matchDurationMin + breakMin) * 60_000;
  const warnings: string[] = [];

  const allPairings: {
    homeId: string;
    awayId: string;
    poolId: string;
    roundIdx: number;
  }[] = [];

  for (const g of groups) {
    let round = 0;
    for (let i = 0; i < g.teamIds.length; i++) {
      for (let j = i + 1; j < g.teamIds.length; j++) {
        allPairings.push({
          homeId: g.teamIds[i],
          awayId: g.teamIds[j],
          poolId: g.id,
          roundIdx: round++,
        });
      }
    }
  }

  const fixtures: GeneratedTournamentFixture[] = [];
  let cursor = new Date(startTime);
  let pitchSlot = 0;

  for (const p of allPairings) {
    const pitchIndex = (pitchSlot % fields) + 1;
    const startsAt = new Date(cursor);
    const endsAt = new Date(startsAt.getTime() + matchDurationMin * 60_000);

    fixtures.push({
      id: `fx_${fixtures.length + 1}`,
      poolId: p.poolId,
      roundLabel: `Poule · J${p.roundIdx + 1}`,
      homeTeamId: p.homeId,
      awayTeamId: p.awayId,
      homeName: teamMap.get(p.homeId) ?? p.homeId,
      awayName: teamMap.get(p.awayId) ?? p.awayId,
      pitchIndex,
      startsAt,
      endsAt,
      phase: 'pool',
    });

    pitchSlot++;
    if (pitchSlot % fields === 0) {
      cursor = new Date(cursor.getTime() + slotMs);
    }
  }

  return { fixtures, warnings };
}

// ── 3. Bracket de phase finale ──────────────────────────────────────

export interface KnockoutFixture extends GeneratedTournamentFixture {
  bracketRound: number;
  bracketPosition: number;
}

const KNOCKOUT_LABELS: Record<number, string> = {
  2: 'Finale',
  4: 'Demi-finale',
  8: 'Quart de finale',
  16: 'Huitième de finale',
};

function knockoutRoundLabel(remainingTeams: number): string {
  return KNOCKOUT_LABELS[remainingTeams] ?? `1/${remainingTeams / 2} de finale`;
}

/**
 * Génère un arbre de phase finale (single elimination).
 * Les `qualifiedTeams` doivent être ordonnés (1er poule A, 1er poule B, 2e poule A…).
 * Les emplacements sont remplis par des BYE si le nombre n'est pas une puissance de 2.
 */
export function generateKnockoutBracket(
  qualifiedTeams: { id: string; name: string }[],
  options: ScheduleOptions,
  existingFixtureCount = 0,
): { fixtures: KnockoutFixture[]; warnings: string[] } {
  const warnings: string[] = [];
  if (qualifiedTeams.length < 2) {
    warnings.push('Pas assez d\'équipes qualifiées pour un bracket.');
    return { fixtures: [], warnings };
  }

  const size = nextPowerOfTwo(qualifiedTeams.length);
  const seeded: ({ id: string; name: string } | null)[] = [];

  for (let i = 0; i < size; i++) {
    seeded.push(i < qualifiedTeams.length ? qualifiedTeams[i] : null);
  }

  const fixtures: KnockoutFixture[] = [];
  let current = [...seeded];
  let round = 0;
  let cursor = new Date(options.startTime);
  const slotMs = (options.matchDurationMin + options.breakMin) * 60_000;
  let fxIndex = existingFixtureCount;
  let pitchSlot = 0;

  while (current.length > 1) {
    const next: ({ id: string; name: string } | null)[] = [];
    const roundLabel = knockoutRoundLabel(current.length);

    for (let i = 0; i < current.length; i += 2) {
      const home = current[i];
      const away = current[i + 1];

      if (!home && !away) {
        next.push(null);
        continue;
      }
      if (!home || !away) {
        next.push(home ?? away);
        continue;
      }

      fxIndex++;
      const pitchIndex = (pitchSlot % options.fields) + 1;
      const startsAt = new Date(cursor);
      const endsAt = new Date(startsAt.getTime() + options.matchDurationMin * 60_000);

      fixtures.push({
        id: `fx_${fxIndex}`,
        poolId: null,
        roundLabel,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeName: home.name,
        awayName: away.name,
        pitchIndex,
        startsAt,
        endsAt,
        phase: 'knockout',
        bracketRound: round,
        bracketPosition: i / 2,
      });

      next.push(null);
      pitchSlot++;
      if (pitchSlot % options.fields === 0) {
        cursor = new Date(cursor.getTime() + slotMs);
      }
    }

    current = next;
    round++;
  }

  return { fixtures, warnings };
}

// ── 4. Recalcul en cas de retard ────────────────────────────────────

export interface RescheduleResult {
  updated: GeneratedTournamentFixture[];
  affectedCount: number;
  summary: string;
}

/**
 * Décale tous les matchs après `fromFixtureId` de `delayMinutes` sur le même terrain
 * (ou tous les terrains si `allPitches` est vrai).
 */
export function reschedule(
  fixtures: GeneratedTournamentFixture[],
  fromFixtureId: string,
  delayMinutes: number,
  allPitches = false,
): RescheduleResult {
  const delayMs = Math.max(0, delayMinutes) * 60_000;
  const idx = fixtures.findIndex((f) => f.id === fromFixtureId);
  if (idx < 0) {
    return { updated: fixtures, affectedCount: 0, summary: 'Match introuvable.' };
  }

  const refPitch = fixtures[idx].pitchIndex;
  let affected = 0;

  const updated = fixtures.map((f, i) => {
    if (i < idx) return f;
    if (!allPitches && f.pitchIndex !== refPitch) return f;
    affected++;
    return {
      ...f,
      startsAt: new Date(f.startsAt.getTime() + delayMs),
      endsAt: new Date(f.endsAt.getTime() + delayMs),
    };
  });

  return {
    updated,
    affectedCount: affected,
    summary: `Retard ${delayMinutes} min : ${affected} match(s) décalé(s)${allPitches ? ' (tous terrains)' : ` (terrain ${refPitch})`}.`,
  };
}

// ── 5. Qualification auto depuis classements de poules ──────────────

export interface PoolStanding {
  teamId: string;
  name: string;
  pts: number;
  gf: number;
  ga: number;
}

/**
 * Extrait les N premiers de chaque poule, ordonnés pour le bracket
 * (1er A vs dernier qualifié, etc.).
 */
export function extractQualifiedTeams(
  poolStandings: Record<string, PoolStanding[]>,
  qualifyPerPool: number,
): { id: string; name: string }[] {
  const poolIds = Object.keys(poolStandings).sort();
  const qualified: { id: string; name: string; rank: number; poolIdx: number }[] = [];

  for (let pi = 0; pi < poolIds.length; pi++) {
    const rows = poolStandings[poolIds[pi]];
    for (let r = 0; r < Math.min(qualifyPerPool, rows.length); r++) {
      qualified.push({ id: rows[r].teamId, name: rows[r].name, rank: r, poolIdx: pi });
    }
  }

  // Seed: 1ers de chaque poule d'abord, puis 2es, etc.
  qualified.sort((a, b) => a.rank - b.rank || a.poolIdx - b.poolIdx);
  return qualified.map(({ id, name }) => ({ id, name }));
}

// ── 6. Génération complète (raccourci haut-niveau) ──────────────────

export interface FullTournamentInput {
  name: string;
  category: string;
  teams: { id: string; name: string }[];
  groupCount: number;
  format: TournamentFormat;
  fields: number;
  matchDurationMin: number;
  breakMin: number;
  startTime: Date;
  qualifyPerPool?: number;
}

export interface FullTournamentPlan {
  groups: GroupDef[];
  teamPool: GeneratedTournamentTeam[];
  poolFixtures: GeneratedTournamentFixture[];
  knockoutFixtures: KnockoutFixture[];
  allFixtures: GeneratedTournamentFixture[];
  warnings: string[];
}

/**
 * Génère un plan complet : poules + (optionnel) bracket de phase finale.
 * Pour `direct_elimination`, saute les poules.
 */
export function generateFullTournamentPlan(input: FullTournamentInput): FullTournamentPlan {
  const schedOpts: ScheduleOptions = {
    fields: Math.max(1, input.fields),
    matchDurationMin: input.matchDurationMin,
    breakMin: input.breakMin,
    startTime: input.startTime,
  };

  if (input.format === 'direct_elimination') {
    const ko = generateKnockoutBracket(input.teams, schedOpts);
    return {
      groups: [],
      teamPool: input.teams.map((t) => ({ ...t, poolId: '' })),
      poolFixtures: [],
      knockoutFixtures: ko.fixtures,
      allFixtures: ko.fixtures,
      warnings: ko.warnings,
    };
  }

  const { groups, teamPool } = generateGroups(input.teams, input.groupCount);
  const teamMap = new Map(input.teams.map((t) => [t.id, t.name]));
  const { fixtures: poolFixtures, warnings } = generateGroupSchedule(groups, teamMap, schedOpts);

  let knockoutFixtures: KnockoutFixture[] = [];
  if (input.format === 'pools_then_knockout') {
    const qualifyPerPool = input.qualifyPerPool ?? 2;
    const placeholders = extractQualifiedTeams(
      Object.fromEntries(
        groups.map((g) => [
          g.id,
          g.teamIds.map((id, rank) => ({
            teamId: id,
            name: teamMap.get(id) ?? id,
            pts: 0,
            gf: 0,
            ga: 0,
          })),
        ]),
      ),
      qualifyPerPool,
    );

    const lastPoolEnd = poolFixtures.length
      ? new Date(Math.max(...poolFixtures.map((f) => f.endsAt.getTime())) + schedOpts.breakMin * 60_000)
      : schedOpts.startTime;

    const koOpts = { ...schedOpts, startTime: lastPoolEnd };
    const ko = generateKnockoutBracket(placeholders, koOpts, poolFixtures.length);
    knockoutFixtures = ko.fixtures;
    warnings.push(...ko.warnings);
  }

  return {
    groups,
    teamPool,
    poolFixtures,
    knockoutFixtures,
    allFixtures: [...poolFixtures, ...knockoutFixtures],
    warnings,
  };
}
