import { isAiVerificationPassing } from '../utils/aiVerification';
import { needsOnboardingDocumentUpload } from '../utils/onboardingGate';
import type { User } from '../models/User';
import { defaultPlayerVerificationState } from '../models/User';

describe('aiVerification', () => {
  it('accepte approved, manual_review et skipped', () => {
    expect(isAiVerificationPassing('approved')).toBe(true);
    expect(isAiVerificationPassing('manual_review')).toBe(true);
    expect(isAiVerificationPassing('skipped')).toBe(true);
    expect(isAiVerificationPassing('rejected')).toBe(false);
    expect(isAiVerificationPassing('processing')).toBe(false);
  });
});

describe('onboardingGate avec IA joueur', () => {
  const baseUser = (overrides: Partial<User>): User => ({
    uid: 'u1',
    display_name: 'Test',
    email: 't@test.fr',
    role: 'player',
    is_verified: false,
    verification_status: 'PENDING',
    profile: {},
    documents: [],
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
    ...overrides,
  });

  it('laisse passer joueur dont identité IA est en revue (pending)', () => {
    expect(
      needsOnboardingDocumentUpload(
        baseUser({
          player_verification: {
            ...defaultPlayerVerificationState(false),
            identity: { status: 'pending' },
          },
        })
      )
    ).toBe(false);
  });

  it('bloque joueur sans identité validée', () => {
    expect(needsOnboardingDocumentUpload(baseUser({}))).toBe(true);
  });
});
