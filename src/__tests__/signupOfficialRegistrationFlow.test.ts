let storedDoc: any = null;
const mockSetDoc = jest.fn().mockImplementation((_ref, data) => {
  storedDoc = data;
  return Promise.resolve();
});
const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockGetDoc = jest.fn().mockImplementation((docRef) => Promise.resolve({
  exists: () => true,
  id: docRef?.id || 'mock-membership-id',
  data: () => storedDoc || ({
    id: 'mock-membership-id',
    club_id: 'montrouge_fc_92',
    player_uid: 'user-player-456',
    player_name: 'Lucas Bernard',
    status: 'pending',
    role: 'player',
    category: 'Seniors R2',
    identity_document_name: 'passeport.pdf',
    identity_document_url: 'file:///data/passeport.pdf',
    identity_document_type: 'passport',
  }),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn((_db, _coll, id) => ({ id: id || 'mock-membership-id' })),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  limit: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => '2026-09-08T20:00:00Z'),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  where: jest.fn(),
}));
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({ getDb: jest.fn(() => ({})) }));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => true),
}));
jest.mock('../services/profile.service', () => ({
  profileService: { updateProfile: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../services/clubs.service', () => ({
  clubsService: {
    getById: jest.fn().mockResolvedValue({ id: 'montrouge_fc_92', name: 'Montrouge FC 92' }),
  },
}));
jest.mock('../services/teams.service', () => ({
  teamsService: {
    getById: jest.fn().mockResolvedValue(null),
    getDefaultTeam: jest.fn().mockResolvedValue({ id: 'default-team' }),
    ensureDefaultTeam: jest.fn().mockResolvedValue({ id: 'default-team' }),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildSignupSteps, needsParentalStep, suggestAppSpaceFromAge } from '../screens/signup/signupFlowConfig';
import { fffOfficialRegistryService } from '../services/fffOfficialRegistry.service';
import { membershipsService } from '../services/memberships.service';
import { isValidPlayerBirthDate } from '../utils/joueurBirthAge';

describe('Official FFF Registration Workflow', () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    await AsyncStorage.clear();
    storedDoc = null;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Official Steps & Categorization', () => {
    it('élimine les étapes gadget (space, location, stats) et produit un flux officiel 100% cohérent', () => {
      const adultSteps = buildSignupSteps('player', {
        role: 'player',
        parentalRequired: false,
      });
      expect(adultSteps).toEqual(['sport', 'account', 'security', 'launch']);
      expect(adultSteps).not.toContain('space');
      expect(adultSteps).not.toContain('location');
      expect(adultSteps).not.toContain('stats');

      const minorSteps = buildSignupSteps('player', {
        role: 'player',
        parentalRequired: true,
      });
      expect(minorSteps).toEqual(['sport', 'account', 'security', 'family', 'launch']);
    });

    it('dérive la catégorie officielle et le besoin parental directement de la date de naissance légale', () => {
      const minorBirthDate = '2010-05-14';
      const adultBirthDate = '2000-01-20';

      const minorValidation = isValidPlayerBirthDate(minorBirthDate);
      expect(minorValidation.ok).toBe(true);
      if (minorValidation.ok) {
        expect(minorValidation.age).toBeLessThan(18);
        const suggestedSpace = suggestAppSpaceFromAge(minorValidation.age);
        expect(suggestedSpace).toBe('boys');
        expect(needsParentalStep(true, suggestedSpace!)).toBe(true);
      }

      const adultValidation = isValidPlayerBirthDate(adultBirthDate);
      expect(adultValidation.ok).toBe(true);
      if (adultValidation.ok) {
        expect(adultValidation.age).toBeGreaterThanOrEqual(18);
        const suggestedSpace = suggestAppSpaceFromAge(adultValidation.age);
        expect(suggestedSpace).toBe('men');
        expect(needsParentalStep(false, suggestedSpace!)).toBe(false);
      }
    });
  });

  describe('Official FFF Club Registry & Roster Lookup', () => {
    it('trouve un club officiel FFF via DOFA (pas de seed locale)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          'hydra:member': [
            {
              cl_no: 21217,
              cl_name: 'MONTROUGE FC 92',
              cl_code: '548221',
              cl_city: 'Montrouge',
              cl_zip: '92120',
            },
          ],
        }),
      });

      const results = await fffOfficialRegistryService.searchOfficialClubs('548221');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const club = results[0];
      expect(club.name).toBe('MONTROUGE FC 92');
      expect(club.fffNumber).toBe('548221');
      expect(club.source).toBe('fff_dofa');
    });

    it('ne fabrique pas de licenciés fictifs si aucun import FootClubs', async () => {
      const roster = await fffOfficialRegistryService.getRosterForTeam('dofa_21217', 'Seniors D1', {
        name: 'MONTROUGE FC 92',
        city: 'Montrouge',
        fffNumber: '548221',
      });
      expect(roster).toEqual([]);
    });

    it('n’autorise plus l’ajout d’un club inventé hors registre FFF', () => {
      expect((fffOfficialRegistryService as { addCustomClub?: unknown }).addCustomClub).toBeUndefined();
    });
  });

  describe('Transmission au Club & Validation en 1 Clic (« Accorder l’accès »)', () => {
    it('transmet la demande d’adhésion officielle avec justificatif d’identité et n° de licence', async () => {
      const requestPayload = {
        club_id: 'montrouge_fc_92',
        player_uid: 'user-player-123',
        player_name: 'Amine Diallo',
        role: 'player' as const,
        category: 'U17 R1',
        license_number: '1423859012',
        identity_document_name: 'cni_amine.jpg',
        identity_document_url: 'file:///data/cni_amine.jpg',
        identity_document_type: 'cni' as const,
        pre_registered_roster_id: 'roster-redstar-u17-1',
      };

      const membership = await membershipsService.requestJoin(requestPayload);
      expect(mockSetDoc).toHaveBeenCalled();
      expect(membership.club_id).toBe('montrouge_fc_92');
      expect(membership.player_uid).toBe('user-player-123');
      expect(membership.status).toBe('pending');
      expect(membership.role).toBe('player');
      expect(membership.category).toBe('U17 R1');
      expect(membership.license_number).toBe('1423859012');
      expect(membership.identity_document_name).toBe('cni_amine.jpg');
      expect(membership.identity_document_type).toBe('cni');
    });

    it('permet au club d’accorder l’accès en 1 clic (mise à jour du statut en active)', async () => {
      await membershipsService.approve('mock-membership-id', 'coach-admin-uid');
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'active',
          validated_by_uid: 'coach-admin-uid',
        })
      );
    });
  });
});
