import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LeagueStandingRow } from '../components/matchs/EliteLeagueStandings';
import { frenchFootballStandingsService } from './frenchFootballStandings.service';

export interface FffStandingRow extends LeagueStandingRow {
  penalties?: number;
  forfeits?: number;
  clubCode?: string;
}

export interface FffFixture {
  id: string;
  matchday: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  venue?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: 'scheduled' | 'live' | 'finished';
}

export interface MyFffTeamLink {
  leagueId: string;
  teamId: string;
  teamName: string;
  districtCode?: string;
  divisionLabel?: string;
  linkedAt: string;
}

export interface FffScrapedCompetition {
  id: string;
  name: string;
  category: 'national' | 'regional' | 'district' | 'jeunes' | 'feminines';
  districtCode?: string; // '92', '93', '75', '94', etc.
  region?: string;
  divisionLabel: string;
  season: string;
  source: 'fff_dofa_live' | 'lpiff_scraper' | 'certified_seed' | 'empty';
  lastSyncAt: string;
  officialFffCertified: boolean;
  standings: FffStandingRow[];
  scorers: Array<{
    rank: number;
    name: string;
    club: string;
    goals: number;
    matches: number;
    ratio: string;
  }>;
  fixtures?: FffFixture[];
}

const STORAGE_CACHE_KEY_PREFIX = '@proday_fff_standings_cache_v1:';
const MY_FFF_TEAM_STORAGE_KEY = '@proday_my_fff_team_v1';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 heures

/**
 * Métadonnées minimales des championnats FFF (sans tableaux de points).
 * Remplace OFFICIAL_IDF_COMPETITIONS — les vraies données viennent de Firestore
 * (fff_league_standings) ou du sync live DOFA/API-Football.
 */
export const FFF_LEAGUE_METADATA: Record<string, {
  id: string;
  name: string;
  category: FffScrapedCompetition['category'];
  region?: string;
  districtCode?: string;
  divisionLabelBase: string;
}> = {
  // Nationales
  ligue1: { id: 'ligue1', name: "Ligue 1 McDonald's", category: 'national', divisionLabelBase: 'Championnat de France' },
  ligue2: { id: 'ligue2', name: 'Ligue 2 BKT', category: 'national', divisionLabelBase: 'Championnat de France' },
  national1: { id: 'national1', name: 'National 1 FFF', category: 'national', divisionLabelBase: 'Championnat de France National' },
  national2_c: { id: 'national2_c', name: 'National 2 · Poule C', category: 'national', divisionLabelBase: 'Quatrième Division FFF' },
  d1_fem: { id: 'd1_fem', name: 'Arkema Première Ligue (D1 Féminine)', category: 'feminines', divisionLabelBase: 'Élite Féminine' },
  u19_nat_a: { id: 'u19_nat_a', name: 'Championnat National U19 · Poule A', category: 'jeunes', divisionLabelBase: 'Élite U19 National' },
  // Régionaux / Districts IDF
  r1_idf_a: { id: 'r1_idf_a', name: 'Régional 1 Île-de-France · Poule A', category: 'regional', region: 'Île-de-France', divisionLabelBase: 'Ligue de Paris Île-de-France · Seniors R1 (Poule A)' },
  r1_idf_b: { id: 'r1_idf_b', name: 'Régional 1 Île-de-France · Poule B', category: 'regional', region: 'Île-de-France', divisionLabelBase: 'Ligue de Paris Île-de-France · Seniors R1 (Poule B)' },
  r2_idf: { id: 'r2_idf', name: 'Régional 2 Île-de-France · Poule B', category: 'regional', region: 'Île-de-France', divisionLabelBase: 'Ligue de Paris Île-de-France · Seniors R2 (Poule B)' },
  d1_d92: { id: 'd1_d92', name: 'Départemental 1 · District 92 (Hauts-de-Seine)', category: 'district', districtCode: '92', region: 'Île-de-France', divisionLabelBase: 'District des Hauts-de-Seine FFF · Seniors D1 (Poule Unique)' },
  d2_d92: { id: 'd2_d92', name: 'Départemental 2 · District 92 (Hauts-de-Seine)', category: 'district', districtCode: '92', region: 'Île-de-France', divisionLabelBase: 'District des Hauts-de-Seine FFF · Seniors D2 (Poule A)' },
  d1_d93: { id: 'd1_d93', name: 'Départemental 1 · District 93 (Seine-Saint-Denis)', category: 'district', districtCode: '93', region: 'Île-de-France', divisionLabelBase: 'District de Seine-Saint-Denis FFF · Seniors D1 (Poule Unique)' },
  d1_d75: { id: 'd1_d75', name: 'Départemental 1 · District 75 (Paris)', category: 'district', districtCode: '75', region: 'Île-de-France', divisionLabelBase: 'District de Paris FFF · Seniors D1 (Poule Unique)' },
  d1_d94: { id: 'd1_d94', name: 'Départemental 1 · District 94 (Val-de-Marne)', category: 'district', districtCode: '94', region: 'Île-de-France', divisionLabelBase: 'District du Val-de-Marne FFF · Seniors D1 (Poule Unique)' },
};

/** Helper : saison en cours (YYYY-YYYY+1, décalé en juillet). */
function currentSeason(): string {
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  const start = m >= 6 ? y : y - 1;
  return `${start}-${start + 1}`;
}

/**
 * Service de scraping et synchronisation FFF officiel.
 */
export const fffScraperService = {
  /**
   * Parse la réponse JSON standard de l'API FFF DOFA (/classement_journees.json ou API Platform Hydra).
   */
  parseFffDofaResponse(json: unknown): FffStandingRow[] {
    if (!json || typeof json !== 'object') return [];
    const root = json as Record<string, unknown>;

    let list: unknown[] = [];
    if (Array.isArray(root['hydra:member'])) {
      list = root['hydra:member'];
    } else if (Array.isArray(root.hydra_member)) {
      list = root.hydra_member;
    } else if (root.donnees && typeof root.donnees === 'object' && Array.isArray((root.donnees as Record<string, unknown>).classement)) {
      list = (root.donnees as Record<string, unknown>).classement as unknown[];
    } else if (Array.isArray(root.classement)) {
      list = root.classement;
    } else if (Array.isArray(root.items)) {
      list = root.items;
    } else if (Array.isArray(json)) {
      list = json;
    }

    const rows: FffStandingRow[] = [];

    list.forEach((entry, idx) => {
      if (!entry || typeof entry !== 'object') return;
      const it = entry as Record<string, unknown>;
      const equipeObj = (it.equipe && typeof it.equipe === 'object') ? (it.equipe as Record<string, unknown>) : {};

      const name = String(
        equipeObj.clgNomEquipe ??
        equipeObj.nom ??
        equipeObj.short_name ??
        it.clgNomEquipe ??
        it.club_name ??
        it.name ??
        `Équipe ${idx + 1}`
      ).trim();

      const rank = Number(it.clgRang ?? it.clt ?? it.rank ?? idx + 1);
      const points = Number(it.clgTotalPoints ?? it.point_total ?? it.points ?? 0);
      const played = Number(it.clgNbJournees ?? it.joue ?? it.played ?? 0);
      const won = Number(it.clgNbGagnes ?? it.gagne ?? it.won ?? 0);
      const drawn = Number(it.clgNbNuls ?? it.nul ?? it.drawn ?? 0);
      const lost = Number(it.clgNbPerdus ?? it.perdu ?? it.lost ?? 0);
      const goals_for = Number(it.clgNbButsPour ?? it.but_pour ?? it.goals_for ?? 0);
      const goals_against = Number(it.clgNbButsContre ?? it.but_contre ?? it.goals_against ?? 0);
      const goal_diff = Number(it.clgDiff ?? it.diff ?? (goals_for - goals_against));
      const penalties = Number(it.clgPenalite ?? it.penalite ?? it.penalties ?? 0);
      const forfeits = Number(it.clgForfait ?? it.forfait ?? it.forfeits ?? 0);

      let formRaw: unknown[] = [];
      const formeProp = it.clgForme ?? it.forme;
      if (Array.isArray(formeProp)) {
        formRaw = formeProp;
      } else if (typeof formeProp === 'string') {
        formRaw = formeProp.split(',').map((s) => s.trim());
      }

      const form: Array<'V' | 'N' | 'D'> = formRaw
        .map((f: unknown) => {
          const s = String(f).toUpperCase();
          if (s.startsWith('V') || s.startsWith('W') || s.startsWith('G')) return 'V';
          if (s.startsWith('N')) return 'N';
          return 'D';
        })
        .slice(-5);

      rows.push({
        rank,
        team_id: String(equipeObj.clNo ?? equipeObj.code ?? `team_${idx + 1}`),
        name,
        played,
        won,
        drawn,
        lost,
        goals_for,
        goals_against,
        goal_diff,
        points,
        form: form.length > 0 ? form : ['V', 'N', 'D'],
        penalties,
        forfeits,
      });
    });

    return rows.sort((a, b) => a.rank - b.rank);
  },

  /**
   * Parse un tableau HTML officiel de la Ligue de Paris ou d'un District FFF.
   */
  parseFffHtmlTable(html: string): FffStandingRow[] {
    const rows: FffStandingRow[] = [];
    if (!html || typeof html !== 'string') return rows;

    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch: RegExpExecArray | null;
    let autoRank = 1;

    while ((trMatch = trRegex.exec(html)) !== null) {
      const rowHtml = trMatch[1];
      if (!rowHtml || rowHtml.includes('<th')) continue;

      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells: string[] = [];
      let tdMatch: RegExpExecArray | null;
      while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
        const clean = tdMatch[1].replace(/<[^>]+>/g, '').trim();
        cells.push(clean);
      }

      if (cells.length >= 8) {
        const parsedRank = parseInt(cells[0], 10);
        const rank = isNaN(parsedRank) ? autoRank : parsedRank;
        const name = cells[1].replace(/\s+/g, ' ').trim();
        const points = parseInt(cells[2], 10) || 0;
        const played = parseInt(cells[3], 10) || 0;
        const won = parseInt(cells[4], 10) || 0;
        const drawn = parseInt(cells[5], 10) || 0;
        const lost = parseInt(cells[6], 10) || 0;
        const goals_for = parseInt(cells[7], 10) || 0;
        const goals_against = parseInt(cells[8], 10) || 0;
        const goal_diff = cells.length > 9 ? (parseInt(cells[9], 10) || (goals_for - goals_against)) : (goals_for - goals_against);

        if (name.length > 1) {
          rows.push({
            rank,
            team_id: `team_${autoRank}`,
            name,
            played,
            won,
            drawn,
            lost,
            goals_for,
            goals_against,
            goal_diff,
            points,
            form: ['V', 'N', 'V', 'D', 'V'],
          });
          autoRank++;
        }
      }
    }

    return rows.sort((a, b) => a.rank - b.rank);
  },

  /**
   * Récupère la compétition depuis le cache persistant si valide.
   */
  async loadFromCache(leagueId: string): Promise<FffScrapedCompetition | null> {
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_CACHE_KEY_PREFIX}${leagueId}`);
      if (!raw) return null;
      const data = JSON.parse(raw) as FffScrapedCompetition;
      const lastSyncTime = new Date(data.lastSyncAt).getTime();
      const now = Date.now();
      if (now - lastSyncTime < CACHE_TTL_MS) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Sauvegarde le résultat certifié dans le cache AsyncStorage.
   * Accepte soit saveToCache(competition) soit saveToCache(leagueId, competition).
   */
  async saveToCache(arg1: string | FffScrapedCompetition, arg2?: FffScrapedCompetition): Promise<void> {
    const data = typeof arg1 === 'string' ? arg2 : arg1;
    const leagueId = typeof arg1 === 'string' ? arg1 : arg1?.id;
    if (!data || !leagueId) return;
    try {
      const toSave: FffScrapedCompetition = {
        ...data,
        lastSyncAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(`${STORAGE_CACHE_KEY_PREFIX}${leagueId}`, JSON.stringify(toSave));
    } catch {
      // best-effort
    }
  },

  /**
   * Efface le cache des classements FFF (globalement ou pour une ligue donnée).
   */
  async clearCache(leagueId?: string): Promise<void> {
    try {
      if (leagueId) {
        await AsyncStorage.removeItem(`${STORAGE_CACHE_KEY_PREFIX}${leagueId}`);
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const fffKeys = keys.filter((k) => k.startsWith(STORAGE_CACHE_KEY_PREFIX));
        if (fffKeys.length > 0) {
          await AsyncStorage.multiRemove(fffKeys);
        }
      }
    } catch {
      // best-effort
    }
  },

  /**
   * Synchronise en direct les classements officiels FFF.
   * Priorité 1 : Firestore (fff_league_standings) — donnée live ou fallback honnête.
   * Priorité 2 : Scrape DOFA direct (best-effort, si le client est connecté).
   * Priorité 3 : Shell vide pour la saison en cours (jamais de données figées 2024/2025).
   */
  async syncOfficialStandings(leagueId: string): Promise<FffScrapedCompetition> {
    // 1. Essai Firestore via frenchFootballStandingsService
    try {
      const cloud = await frenchFootballStandingsService.getCloudLeagueStandings(leagueId);
      if (cloud && cloud.standings && cloud.standings.length > 0) {
        // getCloudLeagueStandings renvoie déjà FrenchLeagueData compatible FffScrapedCompetition
        return {
          id: cloud.id,
          name: cloud.name,
          category: cloud.category,
          region: cloud.region,
          districtCode: cloud.districtCode,
          divisionLabel: cloud.divisionLabel,
          season: cloud.season,
          source: cloud.officialFffCertified ? ('fff_dofa_live' as const) : ('empty' as const),
          lastSyncAt: cloud.lastSyncAt ?? new Date().toISOString(),
          officialFffCertified: cloud.officialFffCertified ?? false,
          standings: cloud.standings as FffStandingRow[],
          scorers: cloud.scorers as FffScrapedCompetition['scorers'],
        };
      }
    } catch {
      // Firestore indisponible côté client — on continue
    }

    // 2. Essai du cache local
    const cached = await this.loadFromCache(leagueId);
    if (cached) {
      return cached;
    }

    // 3. Tentative de scraping DOFA direct (best-effort)
    const meta = FFF_LEAGUE_METADATA[leagueId];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    try {
      const url = `https://api-dofa.fff.fr/api/compets/${leagueId}/classement_journees.json?filter=`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ProDay/1.0',
        },
        signal: controller.signal,
      });

      if (response.ok) {
        const json = await response.json();
        const parsedRows = this.parseFffDofaResponse(json);
        if (parsedRows.length > 0) {
          const result: FffScrapedCompetition = {
            id: leagueId,
            name: meta?.name ?? `Championnat Officiel FFF · ${leagueId.toUpperCase()}`,
            category: meta?.category ?? 'district',
            districtCode: meta?.districtCode,
            region: meta?.region ?? 'Île-de-France',
            divisionLabel: `${currentSeason()} · ${meta?.divisionLabelBase ?? 'Championnat FFF Officiel'}`,
            season: currentSeason(),
            source: 'fff_dofa_live',
            lastSyncAt: new Date().toISOString(),
            officialFffCertified: true,
            standings: parsedRows,
            scorers: [],
          };
          await this.saveToCache(leagueId, result);
          return result;
        }
      }
    } catch {
      // DOFA indisponible
    } finally {
      clearTimeout(timer);
    }

    // 4. Aucune donnée disponible : shell vide pour la saison en cours
    const empty: FffScrapedCompetition = {
      id: leagueId,
      name: meta?.name ?? `Championnat FFF · ${leagueId.toUpperCase()}`,
      category: meta?.category ?? 'district',
      districtCode: meta?.districtCode,
      region: meta?.region ?? 'Île-de-France',
      divisionLabel: `${currentSeason()} · ${meta?.divisionLabelBase ?? 'Championnat FFF Officiel'} (en attente de données)`,
      season: currentSeason(),
      source: 'empty',
      lastSyncAt: new Date().toISOString(),
      officialFffCertified: false,
      standings: [],
      scorers: [],
    };
    await this.saveToCache(leagueId, empty);
    return empty;
  },


  /**
   * Recherche un club dans l'ensemble des compétitions d'Île-de-France.
   * Délègue à frenchFootballStandingsService.searchClubs qui recherche dans Firestore.
   */
  async searchIdfClubs(query: string): Promise<Array<{ competition: FffScrapedCompetition; team: FffStandingRow; club: FffStandingRow }>> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // Délegation au service cloud qui recherche dans fff_league_standings
    const results = await frenchFootballStandingsService.searchClubs(query);
    return results.map((r) => ({
      competition: {
        id: r.league.id,
        name: r.league.name,
        category: r.league.category,
        districtCode: r.league.districtCode,
        region: r.league.region,
        divisionLabel: r.league.divisionLabel,
        season: r.league.season,
        source: r.league.officialFffCertified ? ('fff_dofa_live' as const) : ('empty' as const),
        lastSyncAt: r.league.lastSyncAt ?? new Date().toISOString(),
        officialFffCertified: r.league.officialFffCertified ?? false,
        standings: r.league.standings,
        scorers: r.league.scorers,
      },
      team: r.club,
      club: r.club,
    }));
  },

  /**
   * Récupère l'équipe FFF associée à l'utilisateur (Mon Équipe façon SportEasy).
   */
  async getMyFffTeam(): Promise<MyFffTeamLink | null> {
    try {
      const raw = await AsyncStorage.getItem(MY_FFF_TEAM_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as MyFffTeamLink) : null;
    } catch {
      return null;
    }
  },

  /**
   * Associe son équipe à la FFF (Mon Équipe).
   */
  async setMyFffTeam(link: MyFffTeamLink): Promise<void> {
    try {
      await AsyncStorage.setItem(MY_FFF_TEAM_STORAGE_KEY, JSON.stringify(link));
    } catch {
      // best-effort
    }
  },

  /**
   * Dissocie l'équipe FFF.
   */
  async clearMyFffTeam(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MY_FFF_TEAM_STORAGE_KEY);
    } catch {
      // best-effort
    }
  },

  /**
   * Récupère toutes les rencontres d'une équipe donnée dans un championnat.
   * Sans données figées, renvoie les fixtures live depuis Firestore si disponibles.
   */
  getFixturesForTeam(leagueId: string, teamIdOrName: string): FffFixture[] {
    // Sans le champ fixtures dans fff_league_standings pour l'instant,
    // on renvoie un tableau vide. Le champ fixtures sera peuplé par le
    // prochain enrichissement du sync quotidien (calendrier DOFA).
    return [];
  },

  /**
   * Récupère le prochain match officiel d'une équipe FFF.
   */
  getNextFixture(leagueId: string, teamIdOrName: string): FffFixture | null {
    const fixtures = this.getFixturesForTeam(leagueId, teamIdOrName);
    const scheduled = fixtures.filter((f) => f.status === 'scheduled');
    return scheduled.length > 0 ? scheduled[0] : null;
  },
};
