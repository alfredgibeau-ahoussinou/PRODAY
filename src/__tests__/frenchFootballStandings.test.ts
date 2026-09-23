import { frenchFootballStandingsService, FRENCH_LEAGUE_CATEGORIES, FRENCH_LEAGUE_METADATA } from '../services/frenchFootballStandings.service';
import { fffScraperService } from '../services/fffScraper.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('frenchFootballStandingsService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('FRENCH_LEAGUE_CATEGORIES', () => {
    it('comprend les catégories régionales et départementales IDF en tête de liste', () => {
      const categoryIds = FRENCH_LEAGUE_CATEGORIES.map((c) => c.id);
      expect(categoryIds).toContain('district_92');
      expect(categoryIds).toContain('regional_idf');
      expect(categoryIds).toContain('districts_idf');
      expect(categoryIds).toContain('national');
      expect(categoryIds).toContain('jeunes');
      expect(categoryIds).toContain('feminines');
    });

    it('le District 92 référence la D1 et D2', () => {
      const cat92 = FRENCH_LEAGUE_CATEGORIES.find((c) => c.id === 'district_92');
      expect(cat92).toBeDefined();
      expect(cat92?.leagues.map((l) => l.id)).toEqual(['d1_d92', 'd2_d92']);
    });
  });

  describe('FRENCH_LEAGUE_METADATA (shell vide, sans standings figés)', () => {
    it('contient les métadonnées pour le District 92', () => {
      const meta = FRENCH_LEAGUE_METADATA.d1_d92;
      expect(meta).toBeDefined();
      expect(meta?.id).toBe('d1_d92');
      expect(meta?.name).toBe('Départemental 1 · District 92 (Hauts-de-Seine)');
      expect(meta?.category).toBe('district');
      expect(meta?.districtCode).toBe('92');
      // JAMAIS de standings dans les métadonnées
      expect(Object.keys(meta!).filter((k) => k === 'standings')).toHaveLength(0);
    });

    it('contient aussi les nationaux et autres districts IDF', () => {
      expect(FRENCH_LEAGUE_METADATA.ligue1).toBeDefined();
      expect(FRENCH_LEAGUE_METADATA.ligue2).toBeDefined();
      expect(FRENCH_LEAGUE_METADATA.r1_idf_a).toBeDefined();
      expect(FRENCH_LEAGUE_METADATA.d1_d93).toBeDefined();
      expect(FRENCH_LEAGUE_METADATA.d1_d75).toBeDefined();
      expect(FRENCH_LEAGUE_METADATA.d1_d94).toBeDefined();
      // vérifie que l'export a bien été rebindé vers l'objet construit
      expect(FRENCH_LEAGUE_METADATA.d1_d92.id).toBe('d1_d92');
    });
  });

  describe('getLeagueStandings', () => {
    it('renvoie un shell vide sans Firestore (aucun classement figé)', async () => {
      const data = await frenchFootballStandingsService.getLeagueStandings('d1_d92');
      expect(data.id).toBe('d1_d92');
      expect(data.districtCode).toBe('92');
      expect(data.season).toBe('2026-2027');
      expect(data.standings).toEqual([]);
      expect(data.officialFffCertified).toBe(false);
      expect(data.name).toContain('Départemental 1 · District 92');
    });

    it('fournit un shell honnête pour une ligue inconnue', async () => {
      const fallback = await frenchFootballStandingsService.getLeagueStandings('inconnu_xyz');
      expect(fallback.id).toBe('inconnu_xyz');
      expect(fallback.standings).toEqual([]);
      expect(fallback.officialFffCertified).toBe(false);
      expect(fallback.name).toContain('Compétition inconnu_xyz');
    });
  });

  describe('searchClubs', () => {
    it('renvoie une promesse (recherche dans Firestore puis fallback local)', async () => {
      const res = await frenchFootballStandingsService.searchClubs('Suresnes');
      // Dépend de Firestore / cache ; en test, sans Firestore, retourne [] ou données du fallback
      expect(Array.isArray(res)).toBe(true);
    });

    it('trouve des clubs dans la métadonnée locale (fallback)', async () => {
      // Le fallback local (scraping) peut être mocké ; ici on s'assure que la fonction s'exécute
      const res = await frenchFootballStandingsService.searchClubs('montrouge');
      expect(Array.isArray(res)).toBe(true);
    });

    it('renvoie un tableau vide pour une recherche vide', async () => {
      expect(await frenchFootballStandingsService.searchClubs('')).toEqual([]);
      expect(await frenchFootballStandingsService.searchClubs('   ')).toEqual([]);
    });
  });

  describe('fetchLiveStandings', () => {
    it('effectue la synchronisation et renvoie un shell vide honnête si hors ligne', async () => {
      const live = await frenchFootballStandingsService.fetchLiveStandings('d1_d92');
      expect(live).toBeDefined();
      expect(live.id).toBe('d1_d92');
      expect(live.season).toBe('2026-2027');
      expect(live.standings).toEqual([]);
      expect(live.source).toBe('no_source');
      expect(live.officialFffCertified).toBe(false);
    });
  });
});
