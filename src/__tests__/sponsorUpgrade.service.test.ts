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
  writeBatch: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(),
}));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(),
}));

import { addDoc, collection, doc, getDoc, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { sponsorUpgradeService } from '../services/sponsorUpgrade.service';

const mockIsFirebaseConfigured = isFirebaseConfigured as jest.MockedFunction<
  typeof isFirebaseConfigured
>;
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;

describe('sponsorUpgradeService', () => {
  const mockBatchUpdate = jest.fn();
  const mockBatchCommit = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue({} as ReturnType<typeof getDb>);
    (collection as jest.Mock).mockReturnValue('collection-ref');
    mockDoc.mockReturnValue('request-ref' as unknown as ReturnType<typeof doc>);
    mockWriteBatch.mockReturnValue({
      update: mockBatchUpdate,
      commit: mockBatchCommit,
    } as unknown as ReturnType<typeof writeBatch>);
  });

  it('refuse sans Firebase', async () => {
    mockIsFirebaseConfigured.mockReturnValue(false);
    const res = await sponsorUpgradeService.submitRequest({
      sponsorUid: 's1',
      company: 'Acme',
      city: 'Lyon',
    });
    expect(res.ok).toBe(false);
    expect(res.messageKey).toBe('sponsor.upgrade.error.firebase');
  });

  it('refuse si profil incomplet', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    const res = await sponsorUpgradeService.submitRequest({
      sponsorUid: 's1',
      company: '  ',
      city: 'Lyon',
    });
    expect(res.ok).toBe(false);
    expect(res.messageKey).toBe('sponsor.upgrade.error.profile');
  });

  it('enregistre une demande territoriale', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] } as unknown as Awaited<
      ReturnType<typeof getDocs>
    >);
    mockAddDoc.mockResolvedValue({ id: 'req-1' } as Awaited<ReturnType<typeof addDoc>>);

    const res = await sponsorUpgradeService.submitRequest({
      sponsorUid: 'sponsor-1',
      company: 'Sport Co',
      city: 'Paris',
    });

    expect(res.ok).toBe(true);
    expect(res.messageKey).toBe('sponsor.upgrade.success.pending');
    expect(mockAddDoc).toHaveBeenCalledWith(
      'collection-ref',
      expect.objectContaining({
        sponsor_uid: 'sponsor-1',
        tier: 'territorial',
        company: 'Sport Co',
        city: 'Paris',
        status: 'pending',
      })
    );
  });

  it('évite les doublons pending', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'existing' }],
    } as Awaited<ReturnType<typeof getDocs>>);

    const res = await sponsorUpgradeService.submitRequest({
      sponsorUid: 'sponsor-1',
      company: 'Sport Co',
      city: 'Paris',
    });

    expect(res.ok).toBe(true);
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('liste les demandes actives admin (pending + contacted)', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetDocs.mockRejectedValueOnce(new Error('index'));
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'r1',
          data: () => ({
            sponsor_uid: 's1',
            tier: 'territorial',
            company: 'A',
            city: 'Lyon',
            status: 'pending',
            created_at: { toDate: () => new Date('2026-01-02') },
          }),
        },
        {
          id: 'r2',
          data: () => ({
            sponsor_uid: 's2',
            tier: 'territorial',
            company: 'B',
            city: 'Paris',
            status: 'contacted',
            created_at: { toDate: () => new Date('2026-01-03') },
          }),
        },
        {
          id: 'r3',
          data: () => ({
            sponsor_uid: 's3',
            tier: 'territorial',
            company: 'C',
            city: 'Marseille',
            status: 'approved',
            created_at: { toDate: () => new Date('2026-01-04') },
          }),
        },
      ],
    } as Awaited<ReturnType<typeof getDocs>>);

    const rows = await sponsorUpgradeService.listActiveForAdmin();
    expect(rows.map((r) => r.id)).toEqual(['r2', 'r1']);
  });

  it('marque une demande comme contactée', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockUpdateDoc.mockResolvedValue(undefined);

    const res = await sponsorUpgradeService.markContacted('req-42', 'Appel effectué');

    expect(res.ok).toBe(true);
    expect(res.messageKey).toBe('admin.upgrade.success.contacted');
    expect(mockDoc).toHaveBeenCalledWith({}, 'sponsor_upgrade_requests', 'req-42');
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      'request-ref',
      expect.objectContaining({
        status: 'contacted',
        admin_note: 'Appel effectué',
        contacted_at: { __serverTimestamp: true },
      })
    );
  });

  it('approuve une demande et active Territorial sur le profil sponsor', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        sponsor_uid: 'sponsor-42',
        tier: 'territorial',
        company: 'Sport Co',
        city: 'Paris',
        status: 'pending',
      }),
    } as Awaited<ReturnType<typeof getDoc>>);

    const res = await sponsorUpgradeService.approveRequest('req-99', 'Contrat signé');

    expect(res.ok).toBe(true);
    expect(res.messageKey).toBe('admin.upgrade.success.approved');
    expect(mockWriteBatch).toHaveBeenCalled();
    expect(mockBatchUpdate).toHaveBeenCalledTimes(2);
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      'request-ref',
      expect.objectContaining({
        status: 'approved',
        admin_note: 'Contrat signé',
        approved_at: { __serverTimestamp: true },
      }),
    );
    expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'sponsor-42');
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      'request-ref',
      expect.objectContaining({
        sponsor_tier: 'territorial',
        sponsor_territorial_approved_at: { __serverTimestamp: true },
      }),
    );
    expect(mockBatchCommit).toHaveBeenCalled();
  });

  it('refuse une demande', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockUpdateDoc.mockResolvedValue(undefined);

    const res = await sponsorUpgradeService.rejectRequest('req-77', 'Hors zone');

    expect(res.ok).toBe(true);
    expect(res.messageKey).toBe('admin.upgrade.success.rejected');
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      'request-ref',
      expect.objectContaining({
        status: 'rejected',
        admin_note: 'Hors zone',
        rejected_at: { __serverTimestamp: true },
      })
    );
  });

  it('récupère une demande territoriale approuvée pour le sponsor', async () => {
    mockIsFirebaseConfigured.mockReturnValue(true);
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'approved-1',
          data: () => ({
            sponsor_uid: 'sponsor-1',
            tier: 'territorial',
            company: 'Sport Co',
            city: 'Paris',
            status: 'approved',
            approved_at: { toDate: () => new Date('2026-02-01') },
            created_at: { toDate: () => new Date('2026-01-15') },
          }),
        },
      ],
    } as Awaited<ReturnType<typeof getDocs>>);

    const request = await sponsorUpgradeService.getApprovedTerritorial('sponsor-1');
    expect(request?.id).toBe('approved-1');
    expect(request?.status).toBe('approved');
  });
});
