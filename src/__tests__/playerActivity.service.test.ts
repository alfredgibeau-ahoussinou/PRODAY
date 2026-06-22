jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  deleteDoc: jest.fn(),
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
jest.mock('../lib/firebase', () => ({ getDb: jest.fn(() => null) }));
jest.mock('../lib/firebaseFunctions', () => ({
  callFunction: jest.fn(),
}));
jest.mock('../utils/activityVideoThumbnail', () => ({
  resolveActivityThumbnail: jest.fn(),
}));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(),
}));

import { isFirebaseConfigured } from '../config/firebase';
import { playerActivityService } from '../services/playerActivity.service';

const mockIsFirebaseConfigured = isFirebaseConfigured as jest.MockedFunction<
  typeof isFirebaseConfigured
>;

describe('playerActivityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFirebaseConfigured.mockReturnValue(false);
  });

  it('retourne [] sans Firebase', async () => {
    await expect(playerActivityService.listForPlayer('uid1')).resolves.toEqual([]);
  });

  it('rejette create sans Firebase', async () => {
    await expect(
      playerActivityService.create({
        player_uid: 'uid1',
        type: 'training',
        date: new Date(),
        duration_min: 60,
      })
    ).rejects.toThrow('Firebase non configuré');
  });

  it('rejette delete sans Firebase', async () => {
    await expect(playerActivityService.delete('a1', 'uid1')).rejects.toThrow(
      'Firebase non configuré'
    );
  });
});
