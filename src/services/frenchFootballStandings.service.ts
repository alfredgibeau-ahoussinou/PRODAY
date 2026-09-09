import type { LeagueStandingRow } from '../components/matchs/EliteLeagueStandings';
import { fffScraperService } from './fffScraper.service';

export const FRENCH_LEAGUE_METADATA = FRENCH_LEAGUE_METADATA_internal;

// Métadonnées minimales des championnats (sans tableaux de points).
// Les vraies données viennent de Firestore (fff_league_standings) ou du sync live.
const FRENCH_LEAGUE_METADATA_internal_rebuilt: Record<string, {
  id: string;
  name: string;
  category: FrenchLeagueData['category'];
  region?: string;
  districtCode?: string;
  divisionLabelBase: string;
}> = {

export interface LeagueScorer {
  rank: number;
  name: string;
  club: string;
  goals: number;
  matches: number;
  ratio: string;
  penalties?: number;
}

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
  officialFffCertified?: boolean;
  lastSyncAt?: string;
}

export interface FrenchLeagueCategory {
  id: string;
  label: string;
  leagues: { id: string; name: string; shortLabel: string }[];
}

export const FRENCH_LEAGUE_CATEGORIES: FrenchLeagueCategory[] = [
  {
    id: 'district_92',
    label: 'District 92 (Hauts-de-Seine)',
    leagues: [
      { id: 'd1_d92', name: 'Départemental 1 · District 92', shortLabel: 'D1 District 92' },
      { id: 'd2_d92', name: 'Départemental 2 · District 92', shortLabel: 'D2 District 92' },
    ],
  },
  {
    id: 'regional_idf',
    label: 'Ligue de Paris Île-de-France (LPIFF)',
    leagues: [
      { id: 'r1_idf_a', name: 'Régional 1 IDF · Poule A', shortLabel: 'R1 IDF - Poule A' },
      { id: 'r1_idf_b', name: 'Régional 1 IDF · Poule B', shortLabel: 'R1 IDF - Poule B' },
      { id: 'r2_idf', name: 'Régional 2 IDF · Poule B', shortLabel: 'R2 IDF - Poule B' },
    ],
  },
  {
    id: 'districts_idf',
    label: 'Autres Districts IDF (93, 75, 94)',
    leagues: [
      { id: 'd1_d93', name: 'Départemental 1 · District 93 (Seine-Saint-Denis)', shortLabel: 'D1 District 93' },
      { id: 'd1_d75', name: 'Départemental 1 · District 75 (Paris)', shortLabel: 'D1 District 75' },
      { id: 'd1_d94', name: 'Départemental 1 · District 94 (Val-de-Marne)', shortLabel: 'D1 District 94' },
    ],
  },
  {
    id: 'national',
    label: 'Nationales (FFF)',
    leagues: [
      { id: 'ligue1', name: 'Ligue 1 McDonald\'s', shortLabel: 'Ligue 1' },
      { id: 'ligue2', name: 'Ligue 2 BKT', shortLabel: 'Ligue 2' },
      { id: 'national1', name: 'National 1 FFF', shortLabel: 'National 1' },
      { id: 'national2_c', name: 'National 2 · Poule C', shortLabel: 'N2 - Poule C' },
    ],
  },
  {
    id: 'jeunes',
    label: 'Jeunes Nationaux',
    leagues: [
      { id: 'u19_nat_a', name: 'Championnat National U19 · Poule A', shortLabel: 'U19 Nat - Poule A' },
    ],
  },
  {
    id: 'feminines',
    label: 'Élite Féminine',
    leagues: [
      { id: 'd1_fem', name: 'Arkema Première Ligue (D1 Féminine)', shortLabel: 'D1 Arkema' },
    ],
  },
];

// Métadonnées minimales des championnats (sans tableaux de points).
// Les vraies données viennent de Firestore (fff_league_standings) ou du sync live.
const FRENCH_LEAGUE_METADATA: Record<string, {
  id: string;
  name: string;
  category: FrenchLeagueData['category'];
  region?: string;
  districtCode?: string;
  divisionLabelBase: string;
}> = {
  // Nationales (sync via API-Football)
  ligue1: { id: 'ligue1', name: "Ligue 1 McDonald's", category: 'national', divisionLabelBase: 'Championnat de France' },
  ligue2: { id: 'ligue2', name: 'Ligue 2 BKT', category: 'national', divisionLabelBase: 'Championnat de France' },
  national1: { id: 'national1', name: 'National 1 FFF', category: 'national', divisionLabelBase: 'Championnat de France National' },
  national2_c: { id: 'national2_c', name: 'National 2 · Poule C', category: 'national', divisionLabelBase: 'Quatrième Division FFF' },
  d1_fem: { id: 'd1_fem', name: 'Arkema Première Ligue (D1 Féminine)', category: 'feminines', divisionLabelBase: 'Élite Féminine' },
  u19_nat_a: { id: 'u19_nat_a', name: 'Championnat National U19 · Poule A', category: 'jeunes', divisionLabelBase: 'Élite U19 National' },
  // Régionaux / Districts IDF (sync via DOFA)
  r1_idf_a: { id: 'r1_idf_a', name: 'Régional 1 Île-de-France · Poule A', category: 'regional', region: 'Île-de-France', divisionLabelBase: 'Ligue de Paris Île-de-France · Seniors R1 (Poule A)' },
  r1_idf_b: { id: 'r1_idf_b', name: 'Régional 1 Île-de-France · Poule B', category: 'regional', region: 'Île-de-France', divisionLabelBase: 'Ligue de Paris Île-de-France · Seniors R1 (Poule B)' },
  r2_idf: { id: 'r2_idf', name: 'Régional 2 Île-de-France · Poule B', category: 'regional', region: 'Île-de-France', divisionLabelBase: 'Ligue de Paris Île-de-France · Seniors R2 (Poule B)' },
  d1_d92: { id: 'd1_d92', name: 'Départemental 1 · District 92 (Hauts-de-Seine)', category: 'district', districtCode: '92', region: 'Île-de-France', divisionLabelBase: 'District des Hauts-de-Seine FFF · Seniors D1 (Poule Unique)' },
  d2_d92: { id: 'd2_d92', name: 'Départemental 2 · District 92 (Hauts-de-Seine)', category: 'district', districtCode: '92', region: 'Île-de-France', divisionLabelBase: 'District des Hauts-de-Seine FFF · Seniors D2 (Poule A)' },
  d1_d93: { id: 'd1_d93', name: 'Départemental 1 · District 93 (Seine-Saint-Denis)', category: 'district', districtCode: '93', region: 'Île-de-France', divisionLabelBase: 'District de Seine-Saint-Denis FFF · Seniors D1 (Poule Unique)' },
  d1_d75: { id: 'd1_d75', name: 'Départemental 1 · District 75 (Paris)', category: 'district', districtCode: '75', region: 'Île-de-France', divisionLabelBase: 'District de Paris FFF · Seniors D1 (Poule Unique)' },
  d1_d94: { id: 'd1_d94', name: 'Départemental 1 · District 94 (Val-de-Marne)', category: 'district', districtCode: '94', region: 'Île-de-France', divisionLabelBase: 'District du Val-de-Marne FFF · Seniors D1 (Poule Unique)' },
};

export const FRENCH_LEAGUE_METADATA = FRENCH_LEAGUE_METADATA_internal_rebuilt;

export const frenchFootballStandingsService = {
  /** Récupère la liste des catégories de compétitions françaises. */
  getCategories(): FrenchLeagueCategory[] {
    return FRENCH_LEAGUE_CATEGORIES;
  },

  /** Récupère les classements d'une division française par son ID.
   * Priorité 1 : Firestore (fff_league_standings) — donnée live ou last sync.
   * Priorité 2 : données scrapeées local (cache AsyncStorage).
   * Priorité 3 : shell vide avec métadonnées pour la saison en cours.
   */
  async getLeagueStandings(leagueId: string): Promise<FrenchLeagueData> {
    // 1. Firestore
    const cloud = await this.getCloudLeagueStandings(leagueId);
    if (cloud && cloud.standings && cloud.standings.length > 0) {
      return cloud;
    }
    // 2. Fallback vers données locale (cache ou scrape)
    return this.getLocalFallback(leagueId);
  },

  /** Fallback local : cache AsyncStorage puis shell vide. */
  async getLocalFallback(leagueId: string): Promise<FrenchLeagueData> {
    try {
      const scraped = await fffScraperService.syncOfficialStandings(leagueId);
      if (scraped && scraped.standings && scraped.standings.length > 0) {
        return {
          id: scraped.id,
          name: scraped.name,
          category: scraped.category,
          region: scraped.region,
          districtCode: scraped.districtCode,
          divisionLabel: scraped.divisionLabel,
          season: scraped.season,
          standings: scraped.standings,
          scorers: scraped.scorers,
          officialFffCertified: scraped.officialFffCertified,
          lastSyncAt: scraped.lastSyncAt,
        };
      }
    } catch {
      // scrape échoué
    }
    // 3. Shell vide
    const meta = FRENCH_LEAGUE_METADATA[leagueId];
    const season = (() => { const y = new Date().getFullYear(); const m = new Date().getMonth(); return (m >= 6 ? y : y - 1) + '-' + (m >= 6 ? y + 1 : y); })();
    return {
      id: leagueId,
      name: meta?.name ?? `Championnat FFF · ${leagueId.toUpperCase()}`,
      category: meta?.category ?? 'district',
      region: meta?.region,
      districtCode: meta?.districtCode,
      divisionLabel: `${season} · ${meta?.divisionLabelBase ?? 'Championnat FFF Officiel'} (en attente de données)`,
      season,
      standings: [],
      scorers: [],
      officialFffCertified: false,
      lastSyncAt: new Date().toISOString(),
    };
  },

  /**
   * Récupère les données cloud (Firestore) d'une ligue.
   * Retourne null si pas de document, données vides ou Firestore indisponible.
   */
  async getCloudLeagueStandings(leagueId: string): Promise<FrenchLeagueData | null> {
    try {
      const { getDb } = await import('../lib/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const { isFirebaseConfigured } = await import('../config/firebase');
      if (!isFirebaseConfigured()) return null;
      const database = getDb();
      if (!database) return null;
      const snap = await getDoc(doc(database, 'fff_league_standings', leagueId));
      if (!snap.exists()) return null;
      const data = snap.data() as Record<string, unknown>;
      const standings = Array.isArray(data.standings) ? data.standings : [];
      if (standings.length === 0) return null;
      return {
        id: String(data.id ?? leagueId),
        name: String(data.name ?? leagueId),
        category: (data.category as FrenchLeagueData['category']) ?? 'national',
        region: data.region ? String(data.region) : undefined,
        districtCode: data.districtCode ? String(data.districtCode) : undefined,
        divisionLabel: String(data.divisionLabel ?? ''),
        season: String(data.season ?? ''),
        standings: standings as FrenchLeagueData['standings'],
        scorers: (Array.isArray(data.scorers) ? data.scorers : []) as FrenchLeagueData['scorers'],
        officialFffCertified: data.officialFffCertified === true,
        lastSyncAt: data.lastSyncAt ? String(data.lastSyncAt) : undefined,
      };
    } catch {
      return null;
    }
  },

  /** Recherche un club dans l'ensemble des championnats français et franciliens.
   * Recherche dans Firestore (fff_league_standings) d'abord, puis fallback local.
   */
  async searchClubs(queryText: string): Promise<{ league: FrenchLeagueData; club: LeagueStandingRow }[]> {
    const q = queryText.trim().toLowerCase();
    if (!q) return [];

    // 1. Recherche dans Firestore pour toutes les ligues connues
    const leagueIds = Object.keys(FRENCH_LEAGUE_METADATA);
    const cloudPromises = leagueIds.map((id) => this.getCloudLeagueStandings(id));
    const cloudResults = await Promise.all(cloudPromises);

    const results: { league: FrenchLeagueData; club: LeagueStandingRow }[] = [];
    cloudResults.forEach((cloud) => {
      if (cloud && cloud.standings) {
        cloud.standings.forEach((club) => {
          if (club.name.toLowerCase().includes(q)) {
            results.push({ league: cloud, club });
          }
        });
      }
    });

    if (results.length > 0) return results;

    // 2. Fallback : scrape local pour chaque ligue
    const scrapePromises = leagueIds.map((id) => fffScraperService.syncOfficialStandings(id));
    const scrapeResults = await Promise.all(scrapePromises);
    scrapeResults.forEach((scraped) => {
      if (scraped && scraped.standings) {
        scraped.standings.forEach((club) => {
          if (club.name.toLowerCase().includes(q)) {
            results.push({
              league: {
                id: scraped.id,
                name: scraped.name,
                category: scraped.category,
                region: scraped.region,
                districtCode: scraped.districtCode,
                divisionLabel: scraped.divisionLabel,
                season: scraped.season,
                standings: scraped.standings,
                scorers: scraped.scorers,
                officialFffCertified: scraped.officialFffCertified,
                lastSyncAt: scraped.lastSyncAt,
              },
              club,
            });
          }
        });
      }
    });

    return results;
  },

  /**
   * Cloud sync quotidien d’abord, puis scrape DOFA / seeds certifiés.
   */
  async fetchLiveStandings(leagueId: string): Promise<FrenchLeagueData> {
    const cloud = await this.getCloudLeagueStandings(leagueId);
    if (cloud && cloud.standings && cloud.standings.length > 0) return cloud;
    try {
      const scraped = await fffScraperService.syncOfficialStandings(leagueId);
      if (scraped && scraped.standings && scraped.standings.length > 0) {
        return {
          id: scraped.id,
          name: scraped.name,
          category: scraped.category,
          region: scraped.region,
          districtCode: scraped.districtCode,
          divisionLabel: scraped.divisionLabel,
          season: scraped.season,
          standings: scraped.standings,
          scorers: scraped.scorers,
          officialFffCertified: scraped.officialFffCertified,
          lastSyncAt: scraped.lastSyncAt,
        };
      }
    } catch {
      // scrape échoué
    }
    // Fallback : shell vide
    const meta = FRENCH_LEAGUE_METADATA[leagueId];
    const season = (() => { const y = new Date().getFullYear(); const m = new Date().getMonth(); return (m >= 6 ? y : y - 1) + '-' + (m >= 6 ? y + 1 : y); })();
    return {
      id: leagueId,
      name: meta?.name ?? `Championnat FFF · ${leagueId.toUpperCase()}`,
      category: meta?.category ?? 'district',
      region: meta?.region,
      districtCode: meta?.districtCode,
      divisionLabel: `${season} · ${meta?.divisionLabelBase ?? 'Championnat FFF Officiel'} (en attente de données)`,
      season,
      standings: [],
      scorers: [],
      officialFffCertified: false,
      lastSyncAt: new Date().toISOString(),
    };
  },
};
