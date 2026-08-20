import type { FootballCompetitionEntry } from '../services/footballData/types';

/** Catalog curated — extensible ; API leagues en complément via facade. */
export const SUPPORTER_COMPETITIONS_CATALOG: FootballCompetitionEntry[] = [
  // Europe
  { id: 'ligue1', label: 'Ligue 1', country: 'France', countryCode: 'FR', leagueId: 61 },
  { id: 'ligue2', label: 'Ligue 2', country: 'France', countryCode: 'FR', leagueId: 62 },
  { id: 'd1f', label: 'D1 Féminine', country: 'France', countryCode: 'FR', leagueId: 64 },
  { id: 'pl', label: 'Premier League', country: 'England', countryCode: 'GB', leagueId: 39 },
  { id: 'laliga', label: 'La Liga', country: 'Spain', countryCode: 'ES', leagueId: 140 },
  { id: 'seriea', label: 'Serie A', country: 'Italy', countryCode: 'IT', leagueId: 135 },
  { id: 'bundesliga', label: 'Bundesliga', country: 'Germany', countryCode: 'DE', leagueId: 78 },
  { id: 'primeira', label: 'Primeira Liga', country: 'Portugal', countryCode: 'PT', leagueId: 94 },
  { id: 'eredivisie', label: 'Eredivisie', country: 'Netherlands', countryCode: 'NL', leagueId: 88 },
  { id: 'ucl', label: 'Ligue des Champions', country: 'Europe', countryCode: 'EU', leagueId: 2 },
  { id: 'uel', label: 'Ligue Europa', country: 'Europe', countryCode: 'EU', leagueId: 3 },
  /** API-Football league id 1 — Coupe du monde. */
  { id: 'world_cup', label: 'Coupe du monde', country: 'Monde', countryCode: 'WW', leagueId: 1 },
  // Amériques
  { id: 'brasileirao', label: 'Brasileirão', country: 'Brazil', countryCode: 'BR', leagueId: 71 },
  { id: 'mls', label: 'MLS', country: 'USA', countryCode: 'US', leagueId: 253 },
  { id: 'liga_mx', label: 'Liga MX', country: 'Mexico', countryCode: 'MX', leagueId: 262 },
  { id: 'arg_primera', label: 'Primera División', country: 'Argentina', countryCode: 'AR', leagueId: 128 },
  { id: 'colombia', label: 'Liga BetPlay', country: 'Colombia', countryCode: 'CO', leagueId: 239 },
  // Afrique
  { id: 'egypt_pl', label: 'Premier League', country: 'Egypt', countryCode: 'EG', leagueId: 233 },
  { id: 'south_africa', label: 'Premier Soccer League', country: 'South Africa', countryCode: 'ZA', leagueId: 288 },
  { id: 'morocco', label: 'Botola Pro', country: 'Morocco', countryCode: 'MA', leagueId: 200 },
  { id: 'nigeria', label: 'NPFL', country: 'Nigeria', countryCode: 'NG', leagueId: 332 },
  // Asie
  { id: 'j_league', label: 'J1 League', country: 'Japan', countryCode: 'JP', leagueId: 98 },
  { id: 'k_league', label: 'K League 1', country: 'South Korea', countryCode: 'KR', leagueId: 292 },
  { id: 'saudi_pl', label: 'Saudi Pro League', country: 'Saudi Arabia', countryCode: 'SA', leagueId: 307 },
  { id: 'indian_sl', label: 'Indian Super League', country: 'India', countryCode: 'IN', leagueId: 323 },
];

export const SUPPORTER_COUNTRY_CHIPS = [
  { code: 'FR', label: 'France' },
  { code: 'GB', label: 'Angleterre' },
  { code: 'ES', label: 'Espagne' },
  { code: 'IT', label: 'Italie' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'PT', label: 'Portugal' },
  { code: 'NL', label: 'Pays-Bas' },
  { code: 'BR', label: 'Brésil' },
  { code: 'US', label: 'USA' },
  { code: 'MX', label: 'Mexique' },
  { code: 'AR', label: 'Argentine' },
  { code: 'EG', label: 'Égypte' },
  { code: 'MA', label: 'Maroc' },
  { code: 'JP', label: 'Japon' },
  { code: 'SA', label: 'Arabie saoudite' },
] as const;

export function listCompetitionsForCountry(countryCode?: string): FootballCompetitionEntry[] {
  if (!countryCode) return SUPPORTER_COMPETITIONS_CATALOG;
  return SUPPORTER_COMPETITIONS_CATALOG.filter((c) => c.countryCode === countryCode);
}

export function findCompetitionById(id: string): FootballCompetitionEntry | undefined {
  return SUPPORTER_COMPETITIONS_CATALOG.find((c) => c.id === id);
}
