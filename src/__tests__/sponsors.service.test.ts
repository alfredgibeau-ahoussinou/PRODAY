jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  increment: jest.fn((n: number) => ({ __increment: n })),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(),
  getFirebaseAuth: jest.fn(),
}));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(),
}));
jest.mock('../lib/firebaseFunctions', () => ({
  callFunction: jest.fn(),
}));
jest.mock('../utils/sponsorAnonymousId', () => ({
  getSponsorAnonymousId: jest.fn(async () => 'anon-test-id'),
}));
jest.mock('../services/clubs.service', () => ({
  clubsService: { list: jest.fn(async () => []) },
}));

import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { callFunction } from '../lib/firebaseFunctions';
import { sponsorsService } from '../services/sponsors.service';

const mockIsFirebaseConfigured = isFirebaseConfigured as jest.MockedFunction<
  typeof isFirebaseConfigured
>;
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockGetFirebaseAuth = getFirebaseAuth as jest.MockedFunction<typeof getFirebaseAuth>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockCallFunction = callFunction as jest.MockedFunction<typeof callFunction>;

const offerDoc = {
  id: 'offer-1',
  data: () => ({
    sponsor_uid: 'sponsor-1',
    company_name: 'Co',
    logo_url: '',
    offer_type: 'equipment',
    description: 'Desc',
    value: '100 €',
    target_categories: [],
    city: 'Lyon',
    active: true,
    views_count: 10,
    clicks_count: 4,
    leads_count: 2,
    created_at: { toDate: () => new Date('2026-01-01') },
  }),
};

describe('sponsorsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue({} as ReturnType<typeof getDb>);
    (doc as jest.Mock).mockReturnValue('offer-doc-ref');
    (collection as jest.Mock).mockReturnValue('collection-ref');
    mockCallFunction.mockResolvedValue({ success: true });
  });

  describe('sans Firebase configuré', () => {
    beforeEach(() => {
      mockIsFirebaseConfigured.mockReturnValue(false);
    });

    it('retourne des listes vides au lieu de données démo', async () => {
      await expect(sponsorsService.listOffers(20, 'sponsor-1')).resolves.toEqual([]);
      await expect(sponsorsService.listFundingGoals()).resolves.toEqual([]);
      await expect(sponsorsService.listProspects('sponsor-1')).resolves.toEqual([]);
      await expect(sponsorsService.listActivity('sponsor-1')).resolves.toEqual([]);
      await expect(sponsorsService.listContributions('sponsor-1')).resolves.toEqual([]);
    });

    it('retourne des analytics à zéro', async () => {
      await expect(sponsorsService.getAnalytics('sponsor-1')).resolves.toEqual({
        impressions: 0,
        profile_views: 0,
        offer_clicks: 0,
        clubs_reached: 0,
        leads: 0,
        conversion_rate: 0,
      });
    });

    it('rejette les mutations', async () => {
      await expect(
        sponsorsService.createOffer({
          sponsor_uid: 's1',
          company_name: 'Test',
          description: 'Desc',
          value: '100 €',
          city: 'Lyon',
        })
      ).rejects.toThrow('Firebase non configuré');

      await expect(sponsorsService.toggleOfferActive('offer-1', false)).rejects.toThrow(
        'Firebase non configuré'
      );

      await expect(sponsorsService.contributeToGoal('goal-1', 50)).rejects.toThrow(
        'Firebase non configuré'
      );

      await expect(
        sponsorsService.createFundingGoal({
          club_id: 'club-1',
          title: 'Test',
          description: 'Desc',
          target_amount_eur: 500,
        })
      ).rejects.toThrow('Firebase non configuré');
    });

    it('ignore le tracking sans Firebase', async () => {
      await expect(sponsorsService.trackOfferView('offer-1')).resolves.toBeUndefined();
      await expect(sponsorsService.trackOfferClick('offer-1')).resolves.toBeUndefined();
      await expect(sponsorsService.trackOfferLead('offer-1')).resolves.toBeUndefined();
      await expect(sponsorsService.trackSponsorProfileView('sponsor-1')).resolves.toBeUndefined();
      await expect(sponsorsService.countProfileViews('sponsor-1')).resolves.toBe(0);
      expect(mockCallFunction).not.toHaveBeenCalled();
    });
  });

  describe('avec Firebase configuré', () => {
    beforeEach(() => {
      mockIsFirebaseConfigured.mockReturnValue(true);
      mockGetFirebaseAuth.mockReturnValue({
        currentUser: { uid: 'viewer-1' },
      } as ReturnType<typeof getFirebaseAuth>);
    });

    it('agrège les analytics réels dont profile_views distincts', async () => {
      mockGetDocs
        .mockResolvedValueOnce({
          docs: [offerDoc],
        } as Awaited<ReturnType<typeof getDocs>>)
        .mockResolvedValueOnce({ docs: [], empty: true, size: 0 } as unknown as Awaited<
          ReturnType<typeof getDocs>
        >)
        .mockResolvedValueOnce({
          docs: [
            {
              id: 'v1',
              data: () => ({ viewer_uid: 'alice', sponsor_uid: 'sponsor-1' }),
            },
            {
              id: 'v2',
              data: () => ({ viewer_uid: 'alice', sponsor_uid: 'sponsor-1' }),
            },
            {
              id: 'v3',
              data: () => ({ viewer_anonymous_id: 'anon-1', sponsor_uid: 'sponsor-1' }),
            },
          ],
        } as Awaited<ReturnType<typeof getDocs>>);

      await expect(sponsorsService.getAnalytics('sponsor-1')).resolves.toEqual({
        impressions: 10,
        profile_views: 2,
        offer_clicks: 4,
        clubs_reached: 0,
        leads: 2,
        conversion_rate: 50,
      });
    });

    it('inclut les offres en pause dans getAnalytics via listOffersBySponsor', async () => {
      mockGetDocs
        .mockResolvedValueOnce({
          docs: [
            {
              id: 'paused',
              data: () => ({
                ...offerDoc.data(),
                active: false,
                views_count: 3,
                clicks_count: 1,
                leads_count: 0,
              }),
            },
          ],
        } as Awaited<ReturnType<typeof getDocs>>)
        .mockResolvedValueOnce({ docs: [] } as unknown as Awaited<ReturnType<typeof getDocs>>)
        .mockResolvedValueOnce({ docs: [] } as unknown as Awaited<ReturnType<typeof getDocs>>);

      await expect(sponsorsService.getAnalytics('sponsor-1')).resolves.toMatchObject({
        impressions: 3,
        offer_clicks: 1,
      });
    });

    it('envoie trackOfferLead via callable trackSponsorEvent', async () => {
      await sponsorsService.trackOfferLead('offer-1');
      expect(mockCallFunction).toHaveBeenCalledWith('trackSponsorEvent', {
        event: 'offer_lead',
        offer_id: 'offer-1',
        anonymous_id: 'anon-test-id',
      });
    });

    it('envoie trackSponsorProfileView via callable pour invités et connectés', async () => {
      await sponsorsService.trackSponsorProfileView('sponsor-1');
      expect(mockCallFunction).toHaveBeenCalledWith('trackSponsorEvent', {
        event: 'profile_view',
        sponsor_uid: 'sponsor-1',
        anonymous_id: 'anon-test-id',
      });
    });

    it('trackOfferView sans auth via callable', async () => {
      mockGetFirebaseAuth.mockReturnValue({ currentUser: null } as ReturnType<typeof getFirebaseAuth>);
      await sponsorsService.trackOfferView('offer-guest');
      expect(mockCallFunction).toHaveBeenCalledWith('trackSponsorEvent', {
        event: 'offer_view',
        offer_id: 'offer-guest',
        anonymous_id: 'anon-test-id',
      });
    });
  });
});
