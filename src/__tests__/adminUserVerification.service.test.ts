jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  arrayRemove: jest.fn(),
  arrayUnion: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  deleteField: jest.fn(),
  doc: jest.fn((_db: unknown, col: string, id: string) => ({ path: `${col}/${id}` })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
  writeBatch: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(),
  getFirebaseAuth: jest.fn(),
}));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => true),
}));
jest.mock('../lib/firebaseFunctions', () => ({
  callFunction: jest.fn(),
  getCallableErrorMessage: jest.fn((e: unknown) =>
    e instanceof Error ? e.message : 'callable error',
  ),
  isFunctionsUnavailable: jest.fn(() => false),
}));

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { callFunction } from '../lib/firebaseFunctions';
import { adminService } from '../services/admin.service';

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockCallFunction = callFunction as jest.MockedFunction<typeof callFunction>;

function playerSnap(data: Record<string, unknown> = {}) {
  return {
    exists: () => true,
    data: () => ({
      role: 'player',
      ...data,
    }),
  } as Awaited<ReturnType<typeof getDoc>>;
}

describe('adminService.validateProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue({} as ReturnType<typeof getDb>);
    (doc as jest.Mock).mockImplementation((_db: unknown, col: string, id: string) => ({
      path: `${col}/${id}`,
    }));
    mockGetDoc.mockResolvedValue(playerSnap());
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it('écrit Firestore d’abord même si le callable renvoie permission-denied', async () => {
    const err = Object.assign(new Error('Admin only'), {
      code: 'functions/permission-denied',
    });
    mockCallFunction.mockRejectedValue(err);

    const result = await adminService.validateProfile('u-founder', 'approve');

    expect(mockGetDoc).toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalled();
    expect(mockCallFunction).toHaveBeenCalledWith('validateProfile', {
      uid: 'u-founder',
      action: 'approve',
      rejectionReason: undefined,
    });
    expect(result.via).toBe('firestore');
    expect(result.verification_status).toBe('VERIFIED');
    expect(result.is_verified).toBe(true);
    expect(result.player_verification?.identity.status).toBe('verified');
    expect(result.player_verification?.club_license.status).toBe('verified');

    const written = mockUpdateDoc.mock.calls[0]?.[1] as unknown as Record<string, unknown>;
    expect(written.is_verified).toBe(true);
    expect(written.verification_status).toBe('VERIFIED');
  });

  it('ne throw pas permission-denied si le write Firestore a réussi', async () => {
    mockCallFunction.mockRejectedValue(
      Object.assign(new Error('Droits admin requis'), {
        code: 'functions/permission-denied',
      }),
    );

    await expect(adminService.validateProfile('u1', 'approve')).resolves.toMatchObject({
      via: 'firestore',
      is_verified: true,
    });
  });

  it('retourne via callable quand le push FCM réussit après le write', async () => {
    mockCallFunction.mockResolvedValue({ success: true });

    await expect(adminService.validateProfile('u1', 'approve')).resolves.toMatchObject({
      via: 'callable',
      verification_status: 'VERIFIED',
    });
    expect(mockUpdateDoc).toHaveBeenCalled();
    expect(mockCallFunction).toHaveBeenCalled();
  });
});
