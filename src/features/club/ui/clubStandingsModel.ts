import type { LeagueStandingRow } from '../../../components/matchs/EliteLeagueStandings';
import type { FrenchLeagueCategory } from '../../../services/frenchFootballStandings.service';

/** Normalise les accents et la ponctuation pour comparer des identifiants FFF lisibles. */
export function normalizeStandingLookup(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Détermine la ligne de classement correspondant à l’équipe club active.
 * L’identifiant FFF est prioritaire ; le nom n’est utilisé qu’en secours.
 */
export function isClubStandingRow(
  row: LeagueStandingRow,
  input: { teamId?: string | null; teamName?: string | null },
): boolean {
  const teamId = input.teamId?.trim().toLowerCase();
  if (teamId && row.team_id.trim().toLowerCase() === teamId) return true;

  const teamName = normalizeStandingLookup(input.teamName);
  const rowName = normalizeStandingLookup(row.name);
  if (!teamName || teamName.length < 3 || !rowName) return false;
  return rowName === teamName || rowName.includes(teamName) || teamName.includes(rowName);
}

/** Trouve la catégorie du sélecteur qui contient une ligue, y compris les catalogues cloud. */
export function categoryForLeague(
  leagueId: string | null | undefined,
  categories: FrenchLeagueCategory[],
): string | null {
  if (!leagueId) return null;
  return (
    categories.find((category) => category.leagues.some((league) => league.id === leagueId))?.id ??
    null
  );
}

/** Colonnes contractuelles affichées par le tableau Espace Club. */
export const CLUB_STANDINGS_COLUMNS = [
  'position',
  'team',
  'points',
  'played',
  'won',
  'drawn',
  'lost',
  'goals_for',
  'goals_against',
  'goal_difference',
] as const;

export function formatSyncTimestamp(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `Mis à jour le ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}
