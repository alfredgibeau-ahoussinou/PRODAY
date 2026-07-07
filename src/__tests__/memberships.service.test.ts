jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({ getDb: jest.fn(() => null) }));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(),
}));
jest.mock('../services/profile.service', () => ({
  profileService: { updateProfile: jest.fn() },
}));
jest.mock('../services/clubs.service', () => ({
  clubsService: { getById: jest.fn() },
}));
jest.mock('../services/teams.service', () => ({
  teamsService: {
    getById: jest.fn(),
    ensureDefaultTeam: jest.fn(),
  },
}));

import { isFirebaseConfigured } from '../config/firebase';
import { membershipsService } from '../services/memberships.service';

const mockIsFirebaseConfigured = isFirebaseConfigured as jest.MockedFunction<
  typeof isFirebaseConfigured
>;

describe('membershipsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFirebaseConfigured.mockReturnValue(false);
  });

  it('retourne des listes vides sans Firebase', async () => {
    await expect(membershipsService.listByPlayer('u1')).resolves.toEqual([]);
    await expect(membershipsService.listByClub('c1')).resolves.toEqual([]);
    await expect(membershipsService.getById('m1')).resolves.toBeNull();
  });

  it('rejette requestJoin sans Firebase', async () => {
    await expect(
      membershipsService.requestJoin({
        club_id: 'c1',
        player_uid: 'u1',
        player_name: 'Test',
      }),
    ).rejects.toThrow('Firebase non configuré');
  });

  it('rejette approve sans Firebase', async () => {
    await expect(membershipsService.approve('m1', 'coach-1')).rejects.toThrow(
      'Firebase non configuré',
    );
  });
});
