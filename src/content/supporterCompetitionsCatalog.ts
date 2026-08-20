import type { FootballCompetitionEntry } from '../services/footballData/types';

/** Catalog curated — extensible ; API leagues en complément via facade. */
export const SUPPORTER_COMPETITIONS_CATALOG: FootballCompetitionEntry[] = [
  { id: 'ligue1', label: 'Ligue 1', country: 'France', countryCode: 'FR', leagueId: 61 },
  { id: 'ligue2', label: 'Ligue 2', country: 'France', countryCode: 'FR', leagueId: 62 },
  { id: 'd1f', label: 'D1 Féminine', country: 'France', countryCode: 'FR', leagueId: 64 },
  { id: 'pl', label: 'Premier League', country: 'England', countryCode: 'GB', leagueId: 39 },
  { id: 'laliga', label: 'La Liga', country: 'Spain', countryCode: 'ES', leagueId: 140 },
  { id: 'seriea', label: 'Serie A', country: 'Italy', countryCode: 'IT', leagueId: 135 },
  { id: 'bundesliga', label: 'Bundesliga', country: 'Germany', countryCode: 'DE', leagueId: 78 },
  { id: 'primeira', label: 'Primeira Liga', country: 'Portugal', countryCode: 'PT', leagueId: 94 },
  { id: 'brasileirao', label: 'Brasileirão', country: 'Brazil', countryCode: 'BR', leagueId: 71 },
  { id: 'mls', label: 'MLS', country: 'USA', countryCode: 'US', leagueId: 253 },
  { id: 'ucl', label: 'Ligue des Champions', country: 'Europe', countryCode: 'EU', leagueId: 2 },
  { id: 'uel', label: 'Ligue Europa', country: 'Europe', countryCode: 'EU', leagueId: 3 },
];

export const SUPPORTER_COUNTRY_CHIPS = [
  { code: 'FR', label: 'France' },
  { code: 'GB', label: 'Angleterre' },
  { code: 'ES', label: 'Espagne' },
  { code: 'IT', label: 'Italie' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'PT', label: 'Portugal' },
  { code: 'BR', label: 'Brésil' },
  { code: 'US', label: 'USA' },
] as const;

export function listCompetitionsForCountry(countryCode?: string): FootballCompetitionEntry[] {
  if (!countryCode) return SUPPORTER_COMPETITIONS_CATALOG;
  return SUPPORTER_COMPETITIONS_CATALOG.filter((c) => c.countryCode === countryCode);
}

export function findCompetitionById(id: string): FootballCompetitionEntry | undefined {
  return SUPPORTER_COMPETITIONS_CATALOG.find((c) => c.id === id);
}
