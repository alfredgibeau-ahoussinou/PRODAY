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

// Recherche équipes/événements : services réels mockés (aucun appel réseau dans ce test).
jest.mock('../services/teams.service', () => ({
  teamsService: { listByClubId: jest.fn(async () => []) },
}));
jest.mock('../services/teamEvents.service', () => ({
  teamEventsService: { listForClub: jest.fn(async () => []) },
}));
// CA-12 : on doit pouvoir prouver quelle lecture est tentée.
jest.mock('../services/users.service', () => ({
  usersService: {
    listPlayers: jest.fn(async () => []),
    listPlayersInClub: jest.fn(async () => []),
    listByRole: jest.fn(async () => []),
    getById: jest.fn(async () => null),
    getPublicById: jest.fn(async () => null),
  },
}));

import {
  globalSearchService,
  normalizeSearchQuery,
  APP_PAGE_DESTINATIONS,
} from '../services/globalSearch.service';
import { teamsService } from '../services/teams.service';
import { teamEventsService } from '../services/teamEvents.service';
import { usersService } from '../services/users.service';
import type { PlayerSearchScope } from '../utils/playerSearchScope';

const CLUB_SCOPE: PlayerSearchScope = {
  mode: 'club',
  viewerUid: 'me',
  clubId: 'club-1',
  reason: 'same-club',
};
const NONE_SCOPE: PlayerSearchScope = {
  mode: 'none',
  viewerUid: 'me',
  clubId: null,
  reason: 'no-club',
};
const GLOBAL_SCOPE: PlayerSearchScope = {
  mode: 'global',
  viewerUid: 'me',
  clubId: null,
  reason: 'cross-club-role',
};

describe('globalSearchService', () => {
  describe('périmètre club (équipes & événements)', () => {
    it('refuse de chercher des équipes sans club autorisé', async () => {
      await expect(globalSearchService.searchTeams('U15', null)).resolves.toEqual([]);
      await expect(globalSearchService.searchEvents('match', undefined)).resolves.toEqual([]);
      expect(teamsService.listByClubId).not.toHaveBeenCalled();
    });

    it('remonte les équipes réelles du club autorisé', async () => {
      jest.mocked(teamsService.listByClubId).mockResolvedValueOnce([
        { id: 't1', club_id: 'c1', name: 'U15 A', category: 'U15', is_default: false },
      ] as never);
      const res = await globalSearchService.searchTeams('u15', 'c1');
      expect(teamsService.listByClubId).toHaveBeenCalledWith('c1');
      expect(res.map((t) => t.title)).toEqual(['U15 A']);
      expect(res[0].badge).toBe('Équipe');
    });

    it('n’invente aucun événement sans données réelles', async () => {
      jest.mocked(teamEventsService.listForClub).mockResolvedValueOnce([]);
      const res = await globalSearchService.searchEvents('', 'c1');
      expect(res).toEqual([]);
    });

    it('expose équipes et événements dans le payload global', async () => {
      jest.mocked(teamsService.listByClubId).mockResolvedValueOnce([]);
      jest.mocked(teamEventsService.listForClub).mockResolvedValueOnce([]);
      const payload = await globalSearchService.searchAll({ query: 'x', clubId: 'c1' });
      expect(payload).toHaveProperty('teams');
      expect(payload).toHaveProperty('events');
      expect(Array.isArray(payload.teams)).toBe(true);
      expect(Array.isArray(payload.events)).toBe(true);
    });
  });

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

  describe('searchPlayers (périmètre autorisé + données réelles)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.mocked(usersService.listPlayers).mockResolvedValue([]);
      jest.mocked(usersService.listPlayersInClub).mockResolvedValue([]);
    });

    it('échoue fermé : aucun périmètre ⇒ aucune lecture et aucun résultat', async () => {
      const results = await globalSearchService.searchPlayers('Lucas', NONE_SCOPE);
      expect(results).toEqual([]);
      expect(usersService.listPlayers).not.toHaveBeenCalled();
      expect(usersService.listPlayersInClub).not.toHaveBeenCalled();
    });

    it('périmètre club : interroge le club, jamais l’annuaire global', async () => {
      await globalSearchService.searchPlayers('Lucas', CLUB_SCOPE);
      expect(usersService.listPlayersInClub).toHaveBeenCalledWith('club-1', 'Lucas');
      expect(usersService.listPlayers).not.toHaveBeenCalled();
    });

    it('périmètre global réservé : lecture globale explicite', async () => {
      await globalSearchService.searchPlayers('Lucas', GLOBAL_SCOPE);
      expect(usersService.listPlayers).toHaveBeenCalled();
      expect(usersService.listPlayersInClub).not.toHaveBeenCalled();
    });

    it('ne réinjecte jamais les anciens profils de démonstration', async () => {
      expect(await globalSearchService.searchPlayers('Lucas', CLUB_SCOPE)).toEqual([]);
      expect(
        await globalSearchService.searchPlayers('Rayan Aït-Ahmed', CLUB_SCOPE),
      ).toEqual([]);
    });

    it('transforme les profils réels du club en résultats autorisés', async () => {
      jest.mocked(usersService.listPlayersInClub).mockResolvedValueOnce([
        {
          uid: 'u1',
          display_name: 'Lucas Martin',
          role: 'player',
          profile: { club_id: 'club-1', position: 'Attaquant' },
        },
      ] as never);
      const results = await globalSearchService.searchPlayers('Lucas', CLUB_SCOPE);
      expect(results.map((r) => r.title)).toEqual(['Lucas Martin']);
      expect(results[0].user.profile.club_id).toBe('club-1');
    });

    it('sans périmètre, searchAll ne remonte aucune personne', async () => {
      const payload = await globalSearchService.searchAll({ query: '', scope: NONE_SCOPE });
      expect(payload.players).toEqual([]);
      expect(usersService.listPlayers).not.toHaveBeenCalled();
    });
  });

  describe('searchClubs (données réelles uniquement)', () => {
    it('retourne une liste vide honnête sans service joignable (aucun club démo)', async () => {
      const results = await globalSearchService.searchClubs('');
      expect(results).toEqual([]);
    });

    it('ne réinjecte jamais les anciens clubs de démonstration', async () => {
      const psg = await globalSearchService.searchClubs('PSG');
      expect(psg).toEqual([]);

      const creteil = await globalSearchService.searchClubs('Créteil');
      expect(creteil).toEqual([]);
    });
  });

  describe('searchAll', () => {
    it('les pages restent trouvables même sans données joueurs/clubs', async () => {
      const res = await globalSearchService.searchAll({ query: 'convocation', category: 'all' });
      expect(res.pages.length).toBeGreaterThan(0);
      expect(res.players.length).toBe(0);
      expect(res.clubs.length).toBe(0);
      expect(res.totalCount).toBe(res.pages.length);
    });

    it('filters by category "pages"', async () => {
      const res = await globalSearchService.searchAll({ query: 'match', category: 'pages' });
      expect(res.pages.length).toBeGreaterThan(0);
      expect(res.players.length).toBe(0);
      expect(res.clubs.length).toBe(0);
    });

    it('renvoie zéro joueur/club hors connexion sans en inventer', async () => {
      const res = await globalSearchService.searchAll({ query: 'Lucas', category: 'all' });
      expect(res.players).toEqual([]);
      expect(res.clubs).toEqual([]);
    });
  });
});
