/**
 * Générateur de tournoi club (poules + calendrier + terrains).
 * Pure functions — aucune donnée inventée.
 */

export type ClubTournamentFormat =
  | 'pools_only'
  | 'pools_then_knockout'
  | 'round_robin'
  | 'direct_elimination';

export interface ClubTournamentSetupInput {
  name: string;
  category: string;
  teamCount: number;
  pitchCount: number;
  matchDurationMin: number;
  breakBetweenMin: number;
  poolCount: number;
  format: ClubTournamentFormat;
  startsAt: Date;
  endsAt: Date;
  teamNames?: string[];
}

export interface GeneratedTournamentTeam {
  id: string;
  name: string;
  poolId: string;
}

export interface GeneratedTournamentFixture {
  id: string;
  poolId: string | null;
  roundLabel: string;
  homeTeamId: string;
  awayTeamId: string;
  homeName: string;
  awayName: string;
  pitchIndex: number;
  startsAt: Date;
  endsAt: Date;
  phase: 'pool' | 'knockout';
}

export interface GeneratedTournamentPlan {
  name: string;
  category: string;
  format: ClubTournamentFormat;
  pools: { id: string; name: string; teamIds: string[] }[];
  teams: GeneratedTournamentTeam[];
  fixtures: GeneratedTournamentFixture[];
  /** Avertissements (ex. trop de matchs pour la fenêtre horaire). */
  warnings: string[];
}

function padTeamNames(count: number, provided?: string[]): string[] {
  const names = [...(provided ?? [])].filter(Boolean);
  while (names.length < count) {
    names.push(`Équipe ${names.length + 1}`);
  }
  return names.slice(0, count);
}

/** Round-robin fixtures for a pool (each pair once). */
function poolPairings(teamIds: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      pairs.push([teamIds[i], teamIds[j]]);
    }
  }
  return pairs;
}

/**
 * Génère poules, matchs et horaires sur N terrains.
 * Si la fenêtre horaire est trop courte, retourne des warnings (pas de planning silencieux).
 */
export function generateClubTournamentPlan(
  input: ClubTournamentSetupInput,
): GeneratedTournamentPlan {
  const warnings: string[] = [];
  const teamCount = Math.max(2, Math.floor(input.teamCount));
  const pitchCount = Math.max(1, Math.floor(input.pitchCount));
  const poolCount = Math.max(1, Math.min(Math.floor(input.poolCount), Math.floor(teamCount / 2) || 1));
  const names = padTeamNames(teamCount, input.teamNames);

  if (names.some((n) => /^Équipe \d+$/.test(n))) {
    warnings.push('Certaines équipes utilisent un nom générique — renommez-les avant publication.');
  }

  const pools = Array.from({ length: poolCount }, (_, i) => ({
    id: `pool_${i + 1}`,
    name: `Poule ${String.fromCharCode(65 + i)}`,
    teamIds: [] as string[],
  }));

  const teams: GeneratedTournamentTeam[] = names.map((name, i) => {
    const pool = pools[i % poolCount];
    const id = `team_${i + 1}`;
    pool.teamIds.push(id);
    return { id, name, poolId: pool.id };
  });

  const byId = Object.fromEntries(teams.map((t) => [t.id, t]));
  const fixtures: GeneratedTournamentFixture[] = [];
  let cursor = new Date(input.startsAt);
  const slotMs = (input.matchDurationMin + input.breakBetweenMin) * 60_000;
  let pitchCursor = 0;
  let matchIndex = 0;

  const schedulePair = (
    homeId: string,
    awayId: string,
    poolId: string | null,
    roundLabel: string,
    phase: 'pool' | 'knockout',
  ) => {
    if (cursor.getTime() + input.matchDurationMin * 60_000 > input.endsAt.getTime()) {
      warnings.push(
        'Fenêtre horaire insuffisante pour tous les matchs — proposez une réorganisation avant validation.',
      );
    }
    const startsAt = new Date(cursor);
    const endsAt = new Date(startsAt.getTime() + input.matchDurationMin * 60_000);
    const pitchIndex = (pitchCursor % pitchCount) + 1;
    pitchCursor += 1;
    matchIndex += 1;
    fixtures.push({
      id: `fx_${matchIndex}`,
      poolId,
      roundLabel,
      homeTeamId: homeId,
      awayTeamId: awayId,
      homeName: byId[homeId]?.name ?? homeId,
      awayName: byId[awayId]?.name ?? awayId,
      pitchIndex,
      startsAt,
      endsAt,
      phase,
    });
    if (pitchCursor % pitchCount === 0) {
      cursor = new Date(cursor.getTime() + slotMs);
    }
  };

  if (input.format === 'pools_only' || input.format === 'pools_then_knockout' || input.format === 'round_robin') {
    for (const pool of pools) {
      const pairs = poolPairings(pool.teamIds);
      pairs.forEach(([home, away], idx) => {
        schedulePair(home, away, pool.id, `Poule · J${idx + 1}`, 'pool');
      });
    }
  }

  if (input.format === 'pools_then_knockout' && pools.length >= 2) {
    const qualifiers = pools
      .map((p) => p.teamIds[0])
      .filter(Boolean)
      .slice(0, Math.pow(2, Math.floor(Math.log2(Math.max(pools.length, 2)))));
    for (let i = 0; i + 1 < qualifiers.length; i += 2) {
      schedulePair(qualifiers[i], qualifiers[i + 1], null, 'Demi / finale', 'knockout');
    }
    if (qualifiers.length < 2) {
      warnings.push('Phases finales : données insuffisantes — ajoutez des équipes ou des poules.');
    }
  }

  return {
    name: input.name.trim() || 'Tournoi',
    category: input.category.trim() || 'Catégorie',
    format: input.format,
    pools,
    teams,
    fixtures,
    warnings,
  };
}

/**
 * Proposition de décalage si un match déborde — jamais appliquée silencieusement.
 */
export function proposeTournamentReschedule(
  fixtures: GeneratedTournamentFixture[],
  delayedFixtureId: string,
  delayMin: number,
): { updated: GeneratedTournamentFixture[]; confirmationRequired: true; summary: string } {
  const delayMs = Math.max(0, delayMin) * 60_000;
  const idx = fixtures.findIndex((f) => f.id === delayedFixtureId);
  if (idx < 0) {
    return {
      updated: fixtures,
      confirmationRequired: true,
      summary: 'Match introuvable — aucune modification proposée.',
    };
  }
  const delayed = fixtures[idx];
  const updated = fixtures.map((f, i) => {
    if (i < idx) return f;
    if (f.pitchIndex !== delayed.pitchIndex && i !== idx) return f;
    return {
      ...f,
      startsAt: new Date(f.startsAt.getTime() + delayMs),
      endsAt: new Date(f.endsAt.getTime() + delayMs),
    };
  });
  return {
    updated,
    confirmationRequired: true,
    summary: `Retard ${delayMin} min sur terrain ${delayed.pitchIndex} : ${fixtures.filter((f, i) => i >= idx && f.pitchIndex === delayed.pitchIndex).length} match(s) à décaler. Confirmation requise.`,
  };
}
