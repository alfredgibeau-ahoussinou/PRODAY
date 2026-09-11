jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: () => false,
}));

jest.mock('../lib/firebase', () => ({
  getDb: () => null,
  getFirebaseAuth: () => null,
  getFirebaseStorage: () => null,
}));

import {
  globalSearchService,
  normalizeSearchQuery,
  APP_PAGE_DESTINATIONS,
} from '../services/globalSearch.service';

describe('globalSearchService', () => {
  describe('normalizeSearchQuery', () => {
    it('normalizes accents, spaces and case', () => {
      expect(normalizeSearchQuery('  Éntraînement  ')).toBe('entrainement');
      expect(normalizeSearchQuery('ÉQUIPE')).toBe('equipe');
      expect(normalizeSearchQuery('Matchs & Convocations')).toBe('matchs & convocations');
      expect(normalizeSearchQuery('')).toBe('');
    });
  });

  describe('searchPages', () => {
    it('returns top destinations when query is empty', () => {
      const results = globalSearchService.searchPages('');
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(10);
      expect(results[0].category).toBe('page');
    });

    it('finds match pages when searching "match" or "calendrier"', () => {
      const matchResults = globalSearchService.searchPages('match');
      const hasMatch = matchResults.some(
        (p) => p.title.toLowerCase().includes('match') || p.keywords.includes('matchs'),
      );
      expect(hasMatch).toBe(true);

      const calResults = globalSearchService.searchPages('calendrier');
      expect(calResults.some((p) => p.id === 'page-matchs-calendrier')).toBe(true);
    });

    it('finds Conseiller IA when searching "ia" or "tactique"', () => {
      const iaResults = globalSearchService.searchPages('ia');
      expect(iaResults.some((p) => p.id === 'page-ai-coach')).toBe(true);

      const tacticsResults = globalSearchService.searchPages('tactique');
      expect(tacticsResults.some((p) => p.id === 'page-ai-coach')).toBe(true);
    });

    it('finds Vitrine and Carte ProDay when searching "cv" or "carte"', () => {
      const cvResults = globalSearchService.searchPages('cv');
      expect(cvResults.some((p) => p.id === 'page-profil-vitrine')).toBe(true);

      const cardResults = globalSearchService.searchPages('carte');
      expect(cardResults.some((p) => p.id === 'page-profil-vitrine')).toBe(true);
    });

    it('handles accents seamlessly (e.g. "entrainement" matches "Entraînement")', () => {
      const results = globalSearchService.searchPages('entrainement');
      expect(results.some((p) => p.id === 'page-train-hub')).toBe(true);
    });

    it('finds Convocations when searching "convocation" or "presence"', () => {
      const results = globalSearchService.searchPages('convocation');
      expect(results.some((p) => p.id === 'page-convocations')).toBe(true);
    });
  });

  describe('searchPlayers', () => {
    it('returns players list when searching query or empty', async () => {
      const results = await globalSearchService.searchPlayers('');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category).toBe('player');
      expect(results[0].badge).toBe('Joueur');
    });

    it('finds player by name (e.g. "Lucas")', async () => {
      const results = await globalSearchService.searchPlayers('Lucas');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((p) => p.title.includes('Lucas'))).toBe(true);
    });

    it('finds player by position (e.g. "Attaquant")', async () => {
      const results = await globalSearchService.searchPlayers('Attaquant');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((p) => p.subtitle.includes('Attaquant'))).toBe(true);
    });

    it('finds player by club (e.g. "ProDay")', async () => {
      const results = await globalSearchService.searchPlayers('ProDay');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((p) => p.subtitle.includes('ProDay'))).toBe(true);
    });
  });

  describe('searchClubs', () => {
    it('returns club list when searching query or empty', async () => {
      const results = await globalSearchService.searchClubs('');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category).toBe('club');
      expect(results[0].badge).toBe('Club');
    });

    it('finds club by name (e.g. "PSG")', async () => {
      const results = await globalSearchService.searchClubs('PSG');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.title.includes('PSG Academy'))).toBe(true);
    });

    it('finds club by city (e.g. "Créteil")', async () => {
      const results = await globalSearchService.searchClubs('Créteil');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.title.includes('Créteil'))).toBe(true);
    });
  });

  describe('searchAll', () => {
    it('returns aggregated results across pages, players, and clubs', async () => {
      const res = await globalSearchService.searchAll({ query: 'Paris', category: 'all' });
      expect(res.totalCount).toBeGreaterThan(0);
      expect(res.players.length + res.clubs.length).toBeGreaterThan(0);
    });

    it('filters by category "pages"', async () => {
      const res = await globalSearchService.searchAll({ query: 'match', category: 'pages' });
      expect(res.pages.length).toBeGreaterThan(0);
      expect(res.players.length).toBe(0);
      expect(res.clubs.length).toBe(0);
    });

    it('filters by category "players"', async () => {
      const res = await globalSearchService.searchAll({ query: 'Lucas', category: 'players' });
      expect(res.pages.length).toBe(0);
      expect(res.players.length).toBeGreaterThan(0);
      expect(res.clubs.length).toBe(0);
    });

    it('filters by category "clubs"', async () => {
      const res = await globalSearchService.searchAll({ query: 'Red Star', category: 'clubs' });
      expect(res.pages.length).toBe(0);
      expect(res.players.length).toBe(0);
      expect(res.clubs.length).toBeGreaterThan(0);
    });
  });
});
