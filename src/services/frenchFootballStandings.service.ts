import type { LeagueStandingRow } from '../components/matchs/EliteLeagueStandings';
import type { FffFixture } from './fffScraper.service';

export interface LeagueScorer {
  rank: number;
  name: string;
  club: string;
  goals: number;
  matches: number;
  ratio: string;
  penalties?: number;
}

export type SyncStatus = 'live' | 'awaiting_first_sync' | 'unavailable';

/**
 * Santé de la synchronisation FFF (écrite par le job serveur toutes les 3 h).
 * `stale` = dernier snapshot conservé mais la dernière tentative a échoué :
 * l'UI doit alors afficher l'ancienneté réelle, jamais « à jour ».
 */
export type StandingsSyncHealth = 'ok' | 'degraded' | 'stale' | 'error' | 'unavailable';

/** Cadence serveur (cf. docs/FFF_SYNC_3H.md) — sert au calcul du seuil d'obsolescence. */
export const FFF_SYNC_INTERVAL_MS = 3 * 60 * 60 * 1000;
/** Au-delà de 2 cadences sans succès, le classement est considéré obsolète. */
export const FFF_STALE_AFTER_MS = FFF_SYNC_INTERVAL_MS * 2 + 30 * 60 * 1000;

export interface FrenchLeagueData {
  id: string;
  name: string;
  category: 'national' | 'regional' | 'district' | 'jeunes' | 'feminines';
  region?: string;
  districtCode?: string;
  divisionLabel: string;
  season: string;
  standings: LeagueStandingRow[];
  scorers: LeagueScorer[];
  /** Source technique du snapshot : API/DOFA/cache/empty. */
  source?: string;
  officialFffCertified?: boolean;
  /** Date ISO du dernier snapshot ou de la dernière tentative de synchronisation. */
  lastSyncAt?: string;
  /** Etat affichable par le badge de fraîcheur. */
  syncStatus?: SyncStatus;
  /** Santé de la sync serveur (`sync_health` Firestore). */
  syncHealth?: StandingsSyncHealth;
  /** Dernier message d'erreur serveur (conservé quand le snapshot est obsolète). */
  lastError?: string;
  /** Date ISO de la dernière tentative de synchronisation. */
  lastAttemptAt?: string;
  /** Calendrier officiel publié par le sync DOFA pour cette compétition. */
  fixtures?: FffFixture[];
}

export const SYNC_STATUS_LABELS: Record<SyncStatus | 'unknown', string> = {
  live: '● LIVE FFF',
  awaiting_first_sync: '● OFFICIEL FFF',
  unavailable: '● DONNÉES NON DISPONIBLES',
  unknown: '● SOURCE NON CONFIRMÉE',
};

export const SYNC_STATUS_COLORS: Record<
  SyncStatus | 'unknown',
  { dot: string; text: string; bg: string }
> = {
  live: { dot: '#10B981', text: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  awaiting_first_sync: { dot: '#10B981', text: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  unavailable: { dot: '#10B981', text: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  unknown: { dot: '#10B981', text: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
};


export interface FrenchLeagueCategory {
  id: string;
  label: string;
  leagues: { id: string; name: string; shortLabel: string }[];
}

export const FRENCH_LEAGUE_CATEGORIES: FrenchLeagueCategory[] = [
  {
    id: 'national',
    label: 'Championnats Nationaux (FFF)',
    leagues: [
      { id: 'ligue1', name: "Ligue 1 McDonald's", shortLabel: 'Ligue 1' },
      { id: 'ligue2', name: 'Ligue 2 BKT', shortLabel: 'Ligue 2' },
      { id: 'national1', name: 'National 1 FFF', shortLabel: 'National 1' },
      { id: 'national2_c', name: 'National 2 · Poule C', shortLabel: 'N2 - Poule C' },
      { id: 'national3_idf', name: 'National 3 · Poule Île-de-France', shortLabel: 'N3 - IDF' },
      { id: 'national3_ara', name: 'National 3 · Poule Auvergne-Rhône-Alpes', shortLabel: 'N3 - ARA' },
    ],
  },
  {
    id: 'regional_idf',
    label: 'Ligue de Paris Île-de-France (LPIFF)',
    leagues: [
      { id: 'r1_idf_a', name: 'Régional 1 IDF · Poule A', shortLabel: 'R1 IDF - Poule A' },
      { id: 'r1_idf_b', name: 'Régional 1 IDF · Poule B', shortLabel: 'R1 IDF - Poule B' },
      { id: 'r2_idf', name: 'Régional 2 IDF · Poule B', shortLabel: 'R2 IDF - Poule B' },
      { id: 'r3_idf', name: 'Régional 3 IDF · Poule C', shortLabel: 'R3 IDF - Poule C' },
    ],
  },
  {
    id: 'district_92',
    label: 'District 92 (Hauts-de-Seine)',
    leagues: [
      { id: 'd1_d92', name: 'Départemental 1 · District 92', shortLabel: 'D1 District 92' },
      { id: 'd2_d92', name: 'Départemental 2 · District 92', shortLabel: 'D2 District 92' },
    ],
  },
  {
    id: 'districts_idf',
    label: 'Districts Île-de-France (93, 75, 94, 78, 91, 95, 77)',
    leagues: [
      { id: 'd1_d93', name: 'Départemental 1 · District 93 (Seine-Saint-Denis)', shortLabel: 'D1 District 93' },
      { id: 'd1_d75', name: 'Départemental 1 · District 75 (Paris)', shortLabel: 'D1 District 75' },
      { id: 'd1_d94', name: 'Départemental 1 · District 94 (Val-de-Marne)', shortLabel: 'D1 District 94' },
      { id: 'd1_d78', name: 'Départemental 1 · District 78 (Yvelines)', shortLabel: 'D1 District 78' },
      { id: 'd1_d91', name: 'Départemental 1 · District 91 (Essonne)', shortLabel: 'D1 District 91' },
      { id: 'd1_d95', name: 'Départemental 1 · District 95 (Val-d\'Oise)', shortLabel: 'D1 District 95' },
      { id: 'd1_d77', name: 'Départemental 1 · District 77 (Seine-et-Marne)', shortLabel: 'D1 District 77' },
    ],
  },
  {
    id: 'districts_province',
    label: 'Districts & Métropoles de Province (Lyon, Marseille, Lille...)',
    leagues: [
      { id: 'd1_d69', name: 'Départemental 1 · District 69 (Rhône & Lyon)', shortLabel: 'D1 District 69 (Lyon)' },
      { id: 'd1_d13', name: 'Départemental 1 · District 13 (Bouches-du-Rhône)', shortLabel: 'D1 District 13 (Marseille)' },
      { id: 'd1_d59', name: 'Départemental 1 · District 59 (Nord & Lille)', shortLabel: 'D1 District 59 (Lille)' },
      { id: 'd1_d33', name: 'Départemental 1 · District 33 (Gironde & Bordeaux)', shortLabel: 'D1 District 33 (Bordeaux)' },
      { id: 'd1_d31', name: 'Départemental 1 · District 31 (Haute-Garonne)', shortLabel: 'D1 District 31 (Toulouse)' },
      { id: 'd1_d44', name: 'Départemental 1 · District 44 (Loire-Atlantique)', shortLabel: 'D1 District 44 (Nantes)' },
      { id: 'd1_d35', name: 'Départemental 1 · District 35 (Ille-et-Vilaine)', shortLabel: 'D1 District 35 (Rennes)' },
      { id: 'd1_d06', name: 'Départemental 1 · District 06 (Côte d\'Azur)', shortLabel: 'D1 District 06 (Nice)' },
      { id: 'd1_d67', name: 'Départemental 1 · District 67 (Alsace & Strasbourg)', shortLabel: 'D1 District 67 (Strasbourg)' },
    ],
  },
  {
    id: 'jeunes',
    label: 'Jeunes Nationaux',
    leagues: [
      { id: 'u19_nat_a', name: 'Championnat National U19 · Poule A', shortLabel: 'U19 Nat - Poule A' },
      { id: 'u17_nat', name: 'Championnat National U17 · Poule FFF', shortLabel: 'U17 Nat' },
    ],
  },
  {
    id: 'feminines',
    label: 'Élite Féminine',
    leagues: [
      { id: 'd1_fem', name: 'Arkema Première Ligue (D1 Féminine)', shortLabel: 'D1 Arkema' },
      { id: 'd2_fem', name: 'Seconde Ligue Féminine (D2 Féminine)', shortLabel: 'D2 Féminine' },
    ],
  },
];

/** Métadonnées de l\'ensemble des ligues françaises. */
export const FRENCH_LEAGUE_METADATA: Record<
  string,
  {
    id: string;
    name: string;
    category: FrenchLeagueData['category'];
    region?: string;
    districtCode?: string;
    divisionLabelBase: string;
  }
> = {
  ligue1: { id: 'ligue1', name: "Ligue 1 McDonald's", category: 'national', divisionLabelBase: 'Championnat de France' },
  ligue2: { id: 'ligue2', name: 'Ligue 2 BKT', category: 'national', divisionLabelBase: 'Championnat de France Ligue 2' },
  national1: { id: 'national1', name: 'National 1 FFF', category: 'national', divisionLabelBase: 'Championnat de France National' },
  national2_c: { id: 'national2_c', name: 'National 2 · Poule C', category: 'national', divisionLabelBase: 'Quatrième Division FFF' },
  national3_idf: { id: 'national3_idf', name: 'National 3 · Poule Île-de-France', category: 'national', region: 'Île-de-France', divisionLabelBase: 'Cinquième Division FFF' },
  national3_ara: { id: 'national3_ara', name: 'National 3 · Poule Auvergne-Rhône-Alpes', category: 'national', region: 'Auvergne-Rhône-Alpes', divisionLabelBase: 'Cinquième Division FFF' },
  d1_fem: { id: 'd1_fem', name: 'Arkema Première Ligue (D1 Féminine)', category: 'feminines', divisionLabelBase: 'Élite Féminine' },
  d2_fem: { id: 'd2_fem', name: 'Seconde Ligue Féminine (D2 Féminine)', category: 'feminines', divisionLabelBase: 'Deuxième Division Féminine' },
  u19_nat_a: { id: 'u19_nat_a', name: 'Championnat National U19 · Poule A', category: 'jeunes', divisionLabelBase: 'Élite U19 National' },
  u17_nat: { id: 'u17_nat', name: 'Championnat National U17 · Poule FFF', category: 'jeunes', divisionLabelBase: 'Élite U17 National' },
  r1_idf_a: { id: 'r1_idf_a', name: 'Régional 1 Île-de-France · Poule A', category: 'regional', region: 'Île-de-France', divisionLabelBase: 'Ligue de Paris Île-de-France · Seniors R1 (Poule A)' },
  r1_idf_b: { id: 'r1_idf_b', name: 'Régional 1 Île-de-France · Poule B', category: 'regional', region: 'Île-de-France', divisionLabelBase: 'Ligue de Paris Île-de-France · Seniors R1 (Poule B)' },
  r2_idf: { id: 'r2_idf', name: 'Régional 2 Île-de-France · Poule B', category: 'regional', region: 'Île-de-France', divisionLabelBase: 'Ligue de Paris Île-de-France · Seniors R2 (Poule B)' },
  r3_idf: { id: 'r3_idf', name: 'Régional 3 Île-de-France · Poule C', category: 'regional', region: 'Île-de-France', divisionLabelBase: 'Ligue de Paris Île-de-France · Seniors R3 (Poule C)' },
  d1_d92: { id: 'd1_d92', name: 'Départemental 1 · District 92 (Hauts-de-Seine)', category: 'district', districtCode: '92', region: 'Île-de-France', divisionLabelBase: 'District des Hauts-de-Seine FFF · Seniors D1' },
  d2_d92: { id: 'd2_d92', name: 'Départemental 2 · District 92 (Hauts-de-Seine)', category: 'district', districtCode: '92', region: 'Île-de-France', divisionLabelBase: 'District des Hauts-de-Seine FFF · Seniors D2' },
  d1_d93: { id: 'd1_d93', name: 'Départemental 1 · District 93 (Seine-Saint-Denis)', category: 'district', districtCode: '93', region: 'Île-de-France', divisionLabelBase: 'District de Seine-Saint-Denis FFF · Seniors D1' },
  d1_d75: { id: 'd1_d75', name: 'Départemental 1 · District 75 (Paris)', category: 'district', districtCode: '75', region: 'Île-de-France', divisionLabelBase: 'District de Paris FFF · Seniors D1' },
  d1_d94: { id: 'd1_d94', name: 'Départemental 1 · District 94 (Val-de-Marne)', category: 'district', districtCode: '94', region: 'Île-de-France', divisionLabelBase: 'District du Val-de-Marne FFF · Seniors D1' },
  d1_d78: { id: 'd1_d78', name: 'Départemental 1 · District 78 (Yvelines)', category: 'district', districtCode: '78', region: 'Île-de-France', divisionLabelBase: 'District des Yvelines FFF · Seniors D1' },
  d1_d91: { id: 'd1_d91', name: 'Départemental 1 · District 91 (Essonne)', category: 'district', districtCode: '91', region: 'Île-de-France', divisionLabelBase: 'District de l\'Essonne FFF · Seniors D1' },
  d1_d95: { id: 'd1_d95', name: 'Départemental 1 · District 95 (Val-d\'Oise)', category: 'district', districtCode: '95', region: 'Île-de-France', divisionLabelBase: 'District du Val-d\'Oise FFF · Seniors D1' },
  d1_d77: { id: 'd1_d77', name: 'Départemental 1 · District 77 (Seine-et-Marne)', category: 'district', districtCode: '77', region: 'Île-de-France', divisionLabelBase: 'District de Seine-et-Marne FFF · Seniors D1' },
  d1_d69: { id: 'd1_d69', name: 'Départemental 1 · District 69 (Rhône & Lyon)', category: 'district', districtCode: '69', region: 'Auvergne-Rhône-Alpes', divisionLabelBase: 'District du Rhône FFF · Seniors D1' },
  d1_d13: { id: 'd1_d13', name: 'Départemental 1 · District 13 (Bouches-du-Rhône & Marseille)', category: 'district', districtCode: '13', region: 'PACA', divisionLabelBase: 'District des Bouches-du-Rhône FFF · Seniors D1' },
  d1_d59: { id: 'd1_d59', name: 'Départemental 1 · District 59 (Nord & Lille)', category: 'district', districtCode: '59', region: 'Hauts-de-France', divisionLabelBase: 'District du Nord FFF · Seniors D1' },
  d1_d33: { id: 'd1_d33', name: 'Départemental 1 · District 33 (Gironde & Bordeaux)', category: 'district', districtCode: '33', region: 'Nouvelle-Aquitaine', divisionLabelBase: 'District de Gironde FFF · Seniors D1' },
  d1_d31: { id: 'd1_d31', name: 'Départemental 1 · District 31 (Haute-Garonne & Toulouse)', category: 'district', districtCode: '31', region: 'Occitanie', divisionLabelBase: 'District de Haute-Garonne FFF · Seniors D1' },
  d1_d44: { id: 'd1_d44', name: 'Départemental 1 · District 44 (Loire-Atlantique & Nantes)', category: 'district', districtCode: '44', region: 'Pays de la Loire', divisionLabelBase: 'District de Loire-Atlantique FFF · Seniors D1' },
  d1_d35: { id: 'd1_d35', name: 'Départemental 1 · District 35 (Ille-et-Vilaine & Rennes)', category: 'district', districtCode: '35', region: 'Bretagne', divisionLabelBase: 'District d\'Ille-et-Vilaine FFF · Seniors D1' },
  d1_d06: { id: 'd1_d06', name: 'Départemental 1 · District 06 (Côte d\'Azur & Nice)', category: 'district', districtCode: '06', region: 'PACA', divisionLabelBase: 'District de la Côte d\'Azur FFF · Seniors D1' },
  d1_d67: { id: 'd1_d67', name: 'Départemental 1 · District 67 (Alsace & Strasbourg)', category: 'district', districtCode: '67', region: 'Grand Est', divisionLabelBase: 'District d\'Alsace FFF · Seniors D1' },
};

export function activeFffSeason(now = new Date()): string {
  const year = now.getFullYear();
  const start = now.getMonth() >= 6 ? year : year - 1;
  return `${start}-${start + 1}`;
}

function normalizeSeason(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim().replace('/', '-');
}

function isoDate(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }
  if (value && typeof value === 'object' && 'toDate' in value) {
    const toDate = (value as { toDate?: unknown }).toDate;
    if (typeof toDate === 'function') {
      const parsed = (toDate as () => Date)();
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }
  }
  return undefined;
}

function normalizeStatus(
  raw: unknown,
  source: string | undefined,
  rows: LeagueStandingRow[],
): SyncStatus {
  if (raw === 'live' && rows.length > 0) return 'live';
  if (raw === 'unavailable') return 'unavailable';
  if (raw === 'awaiting_first_sync') return 'awaiting_first_sync';
  if (raw === 'fallback') {
    return source === 'awaiting_dofa_map' || source === 'certified_seed_empty'
      ? 'awaiting_first_sync'
      : 'unavailable';
  }
  if (rows.length > 0 && (source === 'api_football_live' || source === 'fff_dofa_live')) {
    return 'live';
  }
  return rows.length > 0 ? 'live' : 'unavailable';
}

function toStandingRows(value: unknown): LeagueStandingRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
    .map((row, index) => {
      const form = Array.isArray(row.form)
        ? row.form.filter((item): item is 'V' | 'N' | 'D' => item === 'V' || item === 'N' || item === 'D')
        : [];
      return {
        rank: Number(row.rank ?? index + 1) || index + 1,
        team_id: String(row.team_id ?? row.id ?? `team_${index + 1}`),
        name: String(row.name ?? row.team_name ?? 'Équipe inconnue'),
        played: Number(row.played ?? 0) || 0,
        won: Number(row.won ?? 0) || 0,
        drawn: Number(row.drawn ?? 0) || 0,
        lost: Number(row.lost ?? 0) || 0,
        goals_for: Number(row.goals_for ?? 0) || 0,
        goals_against: Number(row.goals_against ?? 0) || 0,
        goal_diff: Number(row.goal_diff ?? 0) || 0,
        points: Number(row.points ?? 0) || 0,
        form,
        isMyTeam: row.isMyTeam === true,
      };
    });
}

function toFixtures(value: unknown): FffFixture[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, index) => ({
      id: String(item.id ?? item.fixture_id ?? `fixture_${index + 1}`),
      matchday: Number(item.matchday ?? item.journee ?? item.round ?? 0) || 0,
      homeTeamName: String(item.homeTeamName ?? item.home_team_name ?? item.home_name ?? item.home ?? ''),
      awayTeamName: String(item.awayTeamName ?? item.away_team_name ?? item.away_name ?? item.away ?? ''),
      homeTeamId: String(item.homeTeamId ?? item.home_team_id ?? item.home_id ?? ''),
      awayTeamId: String(item.awayTeamId ?? item.away_team_id ?? item.away_id ?? ''),
      date: String(item.date ?? item.match_date ?? item.date_match ?? '').slice(0, 10),
      time: String(item.time ?? item.kickoff_time ?? item.heure ?? '00:00').slice(0, 5),
      venue: item.venue || item.stadium || item.lieu ? String(item.venue ?? item.stadium ?? item.lieu) : undefined,
      homeScore: item.homeScore == null && item.home_score == null ? null : Number(item.homeScore ?? item.home_score),
      awayScore: item.awayScore == null && item.away_score == null ? null : Number(item.awayScore ?? item.away_score),
      status: (item.status === 'finished' ? 'finished' : item.status === 'live' ? 'live' : 'scheduled') as FffFixture['status'],
    }))
    .filter((fixture) =>        fixture.homeTeamName && fixture.awayTeamName && /^\d{4}-\d{2}-\d{2}$/.test(fixture.date));
}

/**
 * Dégrade en structure vide honnête quand aucune source réelle n'est disponible
 * (Firestore vide, scraper FFF injoignable, hors ligne).
 * Aucun classement ni buteur inventé : les anciens tableaux « certified seed »
 * étaient des données fictives étiquetées à tort comme certifiées FFF — ils ont
 * été retirés (invariant DATA-01 : zéro donnée de démonstration).
 */
export function buildCertifiedSeedLeague(leagueId: string, requestedSeason?: string): FrenchLeagueData {
  const meta = FRENCH_LEAGUE_METADATA[leagueId];
  return {
    id: leagueId,
    name: meta?.name ?? `Compétition ${leagueId}`,
    category: meta?.category ?? 'district',
    region: meta?.region,
    districtCode: meta?.districtCode,
    divisionLabel: meta?.name ?? `Compétition ${leagueId}`,
    season: requestedSeason || activeFffSeason(),
    standings: [],
    scorers: [],
    source: 'no_source',
    officialFffCertified: false,
    syncStatus: 'unavailable',
    fixtures: [],
  };
}

function emptyLeague(leagueId: string, _status?: SyncStatus, _source = 'certified_seed', season?: string): FrenchLeagueData {
  return buildCertifiedSeedLeague(leagueId, season);
}

export const frenchFootballStandingsService = {
  getCategories(): FrenchLeagueCategory[] {
    return FRENCH_LEAGUE_CATEGORIES;
  },

  async getLeagueStandings(leagueId: string, season?: string): Promise<FrenchLeagueData> {
    const cloud = await this.getCloudLeagueStandings(leagueId, season);
    if (cloud && cloud.standings && cloud.standings.length > 0) return cloud;
    return this.getLocalFallback(leagueId, season);
  },

  async getLocalFallback(leagueId: string, season?: string): Promise<FrenchLeagueData> {
    const s = season || activeFffSeason();
    try {
      const { fffScraperService } = await import('./fffScraper.service');
      const scraped = await fffScraperService.syncOfficialStandings(leagueId);
      if (scraped && scraped.standings && scraped.standings.length > 0 && (!season || scraped.season === season)) {
        const rows = toStandingRows(scraped.standings);
        return {
          id: scraped.id,
          name: scraped.name,
          category: scraped.category,
          region: scraped.region,
          districtCode: scraped.districtCode,
          divisionLabel: scraped.divisionLabel,
          season: scraped.season,
          standings: rows,
          scorers: scraped.scorers && scraped.scorers.length > 0 ? scraped.scorers : [],
          source: scraped.source,
          officialFffCertified: true,
          lastSyncAt: scraped.lastSyncAt,
          syncStatus: 'live',
          fixtures: scraped.fixtures ?? [],
        };
      }
    } catch {
      // Source officielle injoignable : dégradation vide, jamais un classement inventé
    }
    return buildCertifiedSeedLeague(leagueId, s);
  },

  async getCloudLeagueStandings(leagueId: string, season?: string): Promise<FrenchLeagueData | null> {
    const targetSeason = season || activeFffSeason();
    try {
      const { getDb } = await import('../lib/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const { isFirebaseConfigured } = await import('../config/firebase');
      if (!isFirebaseConfigured()) return buildCertifiedSeedLeague(leagueId, targetSeason);
      const database = getDb();
      if (!database) return buildCertifiedSeedLeague(leagueId, targetSeason);
      const snap = await getDoc(doc(database, 'fff_league_standings', leagueId));
      if (!snap.exists()) return buildCertifiedSeedLeague(leagueId, targetSeason);

      const data = snap.data() as Record<string, unknown>;
      const docSeason = normalizeSeason(data.season);
      if (docSeason && docSeason !== targetSeason) return buildCertifiedSeedLeague(leagueId, targetSeason);

      const standings = toStandingRows(data.standings);
      if (standings.length === 0) return buildCertifiedSeedLeague(leagueId, targetSeason);

      const source = data.source ? String(data.source) : undefined;
      const scorers = Array.isArray(data.scorers) && data.scorers.length > 0
        ? (data.scorers as LeagueScorer[])
        : [];

      return {
        id: String(data.id ?? leagueId),
        name: String(data.name ?? FRENCH_LEAGUE_METADATA[leagueId]?.name ?? leagueId),
        category: (data.category as FrenchLeagueData['category']) ?? FRENCH_LEAGUE_METADATA[leagueId]?.category ?? 'district',
        region: data.region ? String(data.region) : FRENCH_LEAGUE_METADATA[leagueId]?.region,
        districtCode: data.districtCode ? String(data.districtCode) : FRENCH_LEAGUE_METADATA[leagueId]?.districtCode,
        divisionLabel: String(data.divisionLabel ?? ''),
        season: targetSeason,
        standings,
        scorers,
        source,
        officialFffCertified: true,
        lastSyncAt: isoDate(data.lastSyncAt) ?? isoDate(data.updated_at),
        // Le snapshot existe : le badge de fraîcheur est piloté par `sync_health`,
        // jamais par la seule présence de lignes (une donnée ancienne n'est pas fraîche).
        syncStatus: 'live',
        syncHealth: normalizeSyncHealth(data.sync_health),
        lastError: typeof data.last_error === 'string' ? data.last_error : undefined,
        lastAttemptAt: isoDate(data.last_attempt_at),
        fixtures: toFixtures(data.fixtures),
      };
    } catch {
      return buildCertifiedSeedLeague(leagueId, targetSeason);
    }
  },

  async searchClubs(queryText: string): Promise<{ league: FrenchLeagueData; club: LeagueStandingRow }[]> {
    const query = queryText.trim().toLowerCase();
    if (!query) return [];

    const leagueIds = Object.keys(FRENCH_LEAGUE_METADATA);
    const cloudResults = await Promise.all(leagueIds.map((id) => this.getCloudLeagueStandings(id)));
    const results: { league: FrenchLeagueData; club: LeagueStandingRow }[] = [];

    cloudResults.forEach((league) => {
      league?.standings.forEach((club) => {
        if (club.name.toLowerCase().includes(query)) results.push({ league, club });
      });
    });

    return results;
  },

  async fetchLiveStandings(leagueId: string, season?: string): Promise<FrenchLeagueData> {
    const s = season || activeFffSeason();
    const cloud = await this.getCloudLeagueStandings(leagueId, s);
    if (cloud && cloud.standings && cloud.standings.length > 0) return cloud;

    try {
      const { fffScraperService } = await import('./fffScraper.service');
      const scraped = await fffScraperService.syncOfficialStandings(leagueId);
      const rows = toStandingRows(scraped.standings);
      if (rows.length > 0) {
        return {
          id: scraped.id,
          name: scraped.name,
          category: scraped.category,
          region: scraped.region,
          districtCode: scraped.districtCode,
          divisionLabel: scraped.divisionLabel,
          season: scraped.season || s,
          standings: rows,
          scorers: scraped.scorers && scraped.scorers.length > 0 ? scraped.scorers : [],
          source: scraped.source,
          officialFffCertified: true,
          lastSyncAt: scraped.lastSyncAt,
          syncStatus: 'live',
          fixtures: scraped.fixtures ?? [],
        };
      }
    } catch {
      // Source officielle injoignable : dégradation vide, jamais un classement inventé
    }
    return buildCertifiedSeedLeague(leagueId, s);
  },

  /**
   * Rafraîchissement manuel (admin) — Cloud Function verrouillée et limitée à
   * un déclenchement toutes les 15 minutes. Ne trompe jamais l'utilisateur :
   * en cas de refus (rate limit / verrou), une erreur explicite est remontée.
   */
  async refreshNow(): Promise<{ updated: number; failed: number; ranAt: string }> {
    const { callFunction } = await import('../lib/firebaseFunctions');
    return callFunction<Record<string, never>, { updated: number; failed: number; ranAt: string }>(
      'syncFffStandingsNow',
      {},
    );
  },
};

function normalizeSyncHealth(value: unknown): StandingsSyncHealth | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().toLowerCase();
  if (
    v === 'ok' ||
    v === 'degraded' ||
    v === 'stale' ||
    v === 'error' ||
    v === 'unavailable'
  ) {
    return v;
  }
  return undefined;
}

/**
 * Décrit l'état de fraîcheur d'un classement pour l'UI.
 * `isStale` est vrai dès que la dernière synchronisation réussie date de plus de
 * deux cadences, ou dès que le serveur signale une erreur : l'ancienneté réelle
 * est alors affichée, jamais un faux « à jour ».
 */
export function describeStandingsFreshness(
  data: FrenchLeagueData | null,
  now = new Date(),
): {
  health: StandingsSyncHealth;
  label: string;
  detail: string;
  color: string;
  isStale: boolean;
  ageLabel: string | null;
} {
  const ageMs = data?.lastSyncAt ? now.getTime() - new Date(data.lastSyncAt).getTime() : null;
  const ageLabel = ageMs != null && ageMs >= 0 ? formatAge(ageMs) : null;

  if (!data || data.syncStatus === 'unavailable' || !data.lastSyncAt) {
    return {
      health: 'unavailable',
      label: 'Aucune donnée officielle disponible',
      detail: data?.lastError
        ? `Dernière erreur : ${data.lastError}`
        : 'La synchronisation FFF n’a pas encore publié de classement pour cette compétition.',
      color: '#94A3B8',
      isStale: true,
      ageLabel: null,
    };
  }

  const reported = data.syncHealth ?? 'ok';
  const tooOld = ageMs != null && ageMs > FFF_STALE_AFTER_MS;
  const health: StandingsSyncHealth = tooOld && reported === 'ok' ? 'stale' : reported;
  const isStale = health !== 'ok';
  const color =
    health === 'ok' ? '#10B981' : health === 'degraded' ? '#F59E0B' : '#EF4444';

  const label =
    health === 'ok'
      ? 'Classement officiel synchronisé'
      : health === 'degraded'
        ? 'Synchronisation partielle'
        : health === 'stale'
          ? 'Classement potentiellement obsolète'
          : 'Erreur de synchronisation';

  const base = `Dernière mise à jour réussie : ${ageLabel ?? 'date inconnue'}`;
  const detail = isStale && data.lastError ? `${base} · ${data.lastError}` : base;

  return { health, label, detail, color, isStale, ageLabel };
}

function formatAge(ms: number): string {
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'à l’instant';
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}
