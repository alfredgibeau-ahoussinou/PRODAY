jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn((_db, col, id) => ({ path: `${col}/${id}`, id })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TS'),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  where: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({ getDb: jest.fn(() => ({})) }));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => true),
}));

import { getDoc, setDoc } from 'firebase/firestore';
import { fffClubRosterService } from '../services/fffClubRoster.service';
import { fffOfficialRegistryService } from '../services/fffOfficialRegistry.service';

describe('fffClubRosterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lit un effectif FootClubs publié par n° d’affiliation', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        affiliation_number: '542557',
        club_name: 'MELUN F.C.',
        source: 'footclubs_import',
        synced_at: { toDate: () => new Date('2026-09-08T03:15:00Z') },
        members: [
          {
            id: '1',
            displayName: 'Amine Diallo',
            role: 'player',
            category: 'U18 R2',
            licenseNumber: '1423859012',
          },
          {
            id: '2',
            displayName: 'Lucas Martin',
            role: 'player',
            category: 'Seniors',
            licenseNumber: '1423859013',
          },
        ],
        member_count: 2,
      }),
    });

    const roster = await fffClubRosterService.listMembersForSignup('542557', 'U18 R2');
    expect(roster.totalInClub).toBe(2);
    expect(roster.members).toHaveLength(1);
    expect(roster.members[0].displayName).toBe('Amine Diallo');
    expect(roster.categoryFallback).toBe(false);
    expect(roster.syncedAt?.toISOString()).toContain('2026-09-08');
  });

  it('retombe sur tout l’effectif si la catégorie ne matche pas (pas de liste vide trompeuse)', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        affiliation_number: '525582',
        club_name: 'LE MEE S. SECTION F.',
        members: [
          { id: 'a', displayName: 'Sophie Leroy', role: 'player', category: 'U15 D1' },
        ],
        member_count: 1,
      }),
    });

    const roster = await fffClubRosterService.listMembersForSignup('525582', 'Seniors D1');
    expect(roster.categoryFallback).toBe(true);
    expect(roster.members).toHaveLength(1);
    expect(roster.members[0].displayName).toBe('Sophie Leroy');
  });

  it('publie un cache sans inventer de licenciés', async () => {
    await fffClubRosterService.publishRoster({
      affiliationNumber: '542557',
      clubName: 'MELUN F.C.',
      prodayClubId: 'club_melun',
      city: 'Melun',
      members: [
        {
          id: 'lic1',
          displayName: 'Amine Diallo',
          role: 'player',
          category: 'U18 R2',
          licenseNumber: '1423859012',
        },
      ],
    });

    expect(setDoc).toHaveBeenCalled();
    const payload = (setDoc as jest.Mock).mock.calls[0][1];
    expect(payload.affiliation_number).toBe('542557');
    expect(payload.members).toHaveLength(1);
    expect(payload.members[0].displayName).toBe('Amine Diallo');
  });
});
