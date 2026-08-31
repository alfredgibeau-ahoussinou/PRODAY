import {
  callFunction,
  getCallableErrorMessage,
} from '../lib/firebaseFunctions';
import { getDb } from '../lib/firebase';
import { adminAuditService } from '../services/adminAudit.service';
import {
  clubCommercialBillingService,
  isBillingFunctionMissing,
} from '../services/clubCommercialBilling.service';

jest.mock('../lib/firebaseFunctions', () => ({
  callFunction: jest.fn(),
  getCallableErrorMessage: jest.fn((e: unknown) =>
    e instanceof Error ? e.message : 'Erreur',
  ),
  isFunctionsUnavailable: jest.fn((e: unknown) => {
    const code =
      e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
    return (
      code === 'functions/not-found' ||
      code === 'functions/unavailable' ||
      code === 'functions/deadline-exceeded'
    );
  }),
}));

jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(),
}));

jest.mock('../services/adminAudit.service', () => ({
  adminAuditService: { log: jest.fn(async () => undefined) },
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db: unknown, ...path: string[]) => ({ path: path.join('/') })),
  updateDoc: jest.fn(async () => undefined),
  serverTimestamp: jest.fn(() => 'SERVER_TS'),
}));

const mockCallFunction = callFunction as jest.MockedFunction<typeof callFunction>;
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

describe('isBillingFunctionMissing', () => {
  it('détecte functions/not-found brut', () => {
    expect(
      isBillingFunctionMissing(
        Object.assign(new Error('not-found'), { code: 'functions/not-found' }),
      ),
    ).toBe(true);
  });

  it('ne confond pas Club introuvable', () => {
    expect(
      isBillingFunctionMissing(
        Object.assign(new Error('Club introuvable'), { code: 'functions/not-found' }),
      ),
    ).toBe(false);
  });
});

describe('clubCommercialBillingService.setAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue({} as ReturnType<typeof getDb>);
  });

  it('persiste sur Firestore si adminClubBilling est absente', async () => {
    mockCallFunction.mockRejectedValue(
      Object.assign(new Error('not-found'), { code: 'functions/not-found' }),
    );

    const result = await clubCommercialBillingService.setAmount({
      clubId: 'club_alfred',
      amountEur: 199,
      offerId: 'veo_lives_2',
      adminUid: 'admin1',
    });

    expect(result.source).toBe('firestore_only');
    expect(result.price.amount_cents).toBe(19900);
    expect(adminAuditService.log).toHaveBeenCalled();
  });

  it('createAndSendInvoice échoue avec message déployable si CF absente', async () => {
    mockCallFunction.mockRejectedValue(
      Object.assign(new Error('not-found'), { code: 'functions/not-found' }),
    );

    await expect(
      clubCommercialBillingService.createAndSendInvoice({
        clubId: 'club_alfred',
        amountEur: 199,
        offerId: 'veo_lives_2',
        customerEmail: 'club@example.com',
      }),
    ).rejects.toThrow(/adminClubBilling/);
  });
});
