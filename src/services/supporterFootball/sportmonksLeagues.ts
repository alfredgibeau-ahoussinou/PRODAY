/**
 * Sportmonks league coverage helpers.
 *
 * Free Plan (documenté Sportmonks) = Superliga (DK) + Premiership (Scotland) only.
 * Ligue 1 (301), PL, Liga, Serie A, Bundesliga, etc. require a paid plan + league selection.
 */

/** Major leagues we want for Supporter Space Ligues (Sportmonks IDs). */
export const DEFAULT_PREFERRED_LEAGUE_IDS: readonly number[] = [
  301, // Ligue 1
  8, // Premier League
  564, // La Liga
  384, // Serie A
  82, // Bundesliga
  2, // Champions League
  5, // Europa League
];

/** Free-plan leagues (fixed by Sportmonks — not customisable). */
export const SPORTMONKS_FREE_PLAN_LEAGUE_IDS: readonly number[] = [
  271, // Superliga (Denmark)
  501, // Premiership (Scotland)
];

export function parsePreferredLeagueIds(
  envValue: string | undefined = process.env.EXPO_PUBLIC_SPORTMONKS_PREFERRED_LEAGUES,
): number[] {
  const raw = (envValue ?? '').trim();
  if (!raw) return [...DEFAULT_PREFERRED_LEAGUE_IDS];
  const ids = raw
    .split(/[,;\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  return ids.length ? ids : [...DEFAULT_PREFERRED_LEAGUE_IDS];
}

export function missingPreferredLeagues(
  availableIds: Iterable<number>,
  preferred: readonly number[] = parsePreferredLeagueIds(),
): number[] {
  const have = new Set(availableIds);
  return preferred.filter((id) => !have.has(id));
}

export function accessiblePreferredLeagues(
  availableIds: Iterable<number>,
  preferred: readonly number[] = parsePreferredLeagueIds(),
): number[] {
  const have = new Set(availableIds);
  return preferred.filter((id) => have.has(id));
}

export function looksLikeFreePlanCoverage(availableIds: readonly number[]): boolean {
  if (!availableIds.length) return false;
  const free = new Set(SPORTMONKS_FREE_PLAN_LEAGUE_IDS);
  return availableIds.every((id) => free.has(id) || id === 513 || id === 1659);
}

/** French short reason for UI — no fake Ligue 1. */
export function buildLeagueCoverageMessage(opts: {
  availableNames: string[];
  missingPreferred: number[];
}): string | undefined {
  const { availableNames, missingPreferred } = opts;
  if (!missingPreferred.length) return undefined;
  const names =
    availableNames.length > 0
      ? availableNames.slice(0, 4).join(', ')
      : 'ligues du plan Free';
  const wantsLigue1 = missingPreferred.includes(301);
  if (wantsLigue1) {
    return `Plan Sportmonks limité (${names}). Ligue 1 et top ligues hors abonnement — upgrade Sportmonks (essai payant) pour les débloquer.`;
  }
  return `Plan Sportmonks limité (${names}). Certaines ligues majeures ne sont pas dans ton abonnement.`;
}
