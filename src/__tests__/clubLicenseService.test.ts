jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => null }),
  getDocs: jest.fn(),
  limit: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({ getDb: jest.fn(() => ({})) }));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => true),
}));
jest.mock('../services/profile.service', () => ({
  profileService: { updateProfile: jest.fn(() => Promise.resolve()) },
}));
jest.mock('../services/memberships.service', () => ({
  membershipsService: { listByClub: jest.fn(() => Promise.resolve([])) },
}));

import { clubLicenseService } from '../features/club/services/clubLicenseService';
import type { ParsedLicenseRow } from '../features/club/utils/footclubsCsvParser';
import type { User } from '../models/User';

describe('clubLicenseService', () => {
  it('traite un lot de licenciés en distinguant les joueurs existants et les nouveaux', async () => {
    const rows: ParsedLicenseRow[] = [
      {
        licenseNumber: '1111111111',
        lastName: 'Diallo',
        firstName: 'Moussa',
        displayName: 'Moussa Diallo',
        email: 'moussa@test.com',
        medicalValid: true,
        raw: {},
      },
      {
        licenseNumber: '2222222222',
        lastName: 'Benzema',
        firstName: 'Karim',
        displayName: 'Karim Benzema',
        email: 'karim@test.com',
        medicalValid: true,
        raw: {},
      },
    ];

    const existingPlayers: Partial<User>[] = [
      {
        uid: 'user-diallo',
        display_name: 'Moussa Diallo',
        email: 'moussa@test.com',
        role: 'player',
        profile: {},
      },
    ];

    const summary = await clubLicenseService.importLicensedRoster({
      clubId: 'club-test',
      rows,
      approverUid: 'staff-admin',
      existingPlayers: existingPlayers as User[],
    });

    expect(summary.totalProcessed).toBe(2);
    expect(summary.updatedCount).toBe(1);
    expect(summary.newPendingCount).toBe(1);
  });
});
