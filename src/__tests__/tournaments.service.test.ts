jest.mock('firebase/firestore', () => ({
  arrayUnion: jest.fn(),
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
}));
jest.mock('../lib/firebase', () => ({ getDb: jest.fn(() => null) }));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(),
}));

import { isFirebaseConfigured } from '../config/firebase';
import { tournamentsService } from '../services/tournaments.service';

const mockIsFirebaseConfigured = isFirebaseConfigured as jest.MockedFunction<
  typeof isFirebaseConfigured
>;

describe('tournamentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFirebaseConfigured.mockReturnValue(false);
  });

  it('retourne des listes vides sans Firebase', async () => {
    await expect(tournamentsService.listUpcoming()).resolves.toEqual([]);
    await expect(tournamentsService.getById('demo-u17')).resolves.toBeNull();
  });

  it('rejette les mutations sans Firebase', async () => {
    await expect(
      tournamentsService.create({
        title: 'Test',
        city: 'Lyon',
        starts_at: new Date(),
        max_teams: 8,
        entry_fee_cents: 0,
        categories: ['U17'],
        organizer_uid: 'org-1',
        organizer_name: 'Org',
      })
    ).rejects.toThrow('Firebase non configuré');

    await expect(
      tournamentsService.registerTeam({
        tournament_id: 't1',
        club_id: 'c1',
        club_name: 'Club',
        captain_uid: 'u1',
        captain_name: 'Cap',
        player_uids: [],
        player_names: [],
      })
    ).rejects.toThrow('Tournoi introuvable.');

    await expect(tournamentsService.generatePoolsAndFixtures('t1')).rejects.toThrow(
      'Tournoi introuvable.'
    );

    await expect(tournamentsService.submitFixtureScore('t1', 'f1', 1, 0)).rejects.toThrow(
      'Tournoi introuvable.'
    );
  });
});
