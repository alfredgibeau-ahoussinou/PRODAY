jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(),
}));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(),
}));

import { addDoc, collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { subscriptionUpgradeRequestService } from '../services/subscriptionUpgradeRequest.service';
import type { User } from '../models/User';

const mockIsFirebaseConfigured = isFirebaseConfigured as jest.MockedFunction<
  typeof isFirebaseConfigured
>;
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;

const user = {
  uid: 'u1',
  email: 'player@test.fr',
  display_name: 'Joueur Test',
  role: 'player',
} as User;

describe('subscriptionUpgradeRequestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue({} as ReturnType<typeof getDb>);
    (collection as jest.Mock).mockReturnValue('collection-ref');
    (doc as jest.Mock).mockReturnValue('doc-ref');
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] } as never);
  });

  it('refuse sans Firebase', async () => {
    mockIsFirebaseConfigured.mockReturnValue(false);
    const res = await subscriptionUpgradeRequestService.submitRequest({
      user,
      planId: 'player_plus',
    });
    expect(res.ok).toBe(false);
    expect(res.messageKey).toBe('subscription.betaRequest.error.firebase');
  });

  it('enregistre une demande Pro bêta', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockAddDoc.mockResolvedValue({ id: 'req-1' } as never);

    const res = await subscriptionUpgradeRequestService.submitRequest({
      user,
      planId: 'player_plus',
      billing: 'monthly',
    });

    expect(res.ok).toBe(true);
    expect(res.messageKey).toBe('subscription.betaRequest.success.pending');
    expect(mockAddDoc).toHaveBeenCalled();
    const payload = mockAddDoc.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.user_uid).toBe('u1');
    expect(payload.plan_id).toBe('player_plus');
    expect(payload.status).toBe('pending');
  });

  it('évite les doublons pending', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'existing' }],
    } as never);

    const res = await subscriptionUpgradeRequestService.submitRequest({
      user,
      planId: 'player_plus',
    });

    expect(res.ok).toBe(true);
    expect(res.messageKey).toBe('subscription.betaRequest.success.pending');
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('approuve côté admin (statut)', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockUpdateDoc.mockResolvedValue(undefined);

    const res = await subscriptionUpgradeRequestService.updateRequestStatus(
      'req-99',
      'approved',
      'OK bêta',
    );

    expect(res.ok).toBe(true);
    expect(mockUpdateDoc).toHaveBeenCalled();
  });
});
