import {
  needsOnboardingDocumentUpload,
  shouldShowPlayerVerificationReminder,
} from '../utils/onboardingGate';
import type { User } from '../models/User';

function baseUser(overrides: Partial<User>): User {
  return {
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
  };
}

describe('onboardingGate', () => {
  it('bloque le dashboard tant que les documents ne sont pas envoyés', () => {
    expect(needsOnboardingDocumentUpload(baseUser({ role: 'player' }))).toBe(true);
    expect(
      needsOnboardingDocumentUpload(
        baseUser({ role: 'player', onboarding_documents_submitted: true })
      )
    ).toBe(false);
  });

  it('exige des documents pour coach et pôle médical', () => {
    expect(needsOnboardingDocumentUpload(baseUser({ role: 'coach' }))).toBe(true);
    expect(needsOnboardingDocumentUpload(baseUser({ role: 'physio' }))).toBe(true);
  });

  it('laisse passer sponsor sans documents', () => {
    expect(
      needsOnboardingDocumentUpload(
        baseUser({ role: 'sponsor', verification_status: 'NOT_REQUIRED' })
      )
    ).toBe(false);
  });

  it('contourne les documents pour les emails beta', () => {
    expect(
      needsOnboardingDocumentUpload(
        baseUser({ role: 'coach', email: 'alfredgibeauahoussinou@gmail.com' })
      )
    ).toBe(false);
  });

  it('masque le rappel vérification joueur après inscription', () => {
    expect(
      shouldShowPlayerVerificationReminder(
        baseUser({ role: 'player', onboarding_documents_submitted: true })
      )
    ).toBe(false);
    expect(
      shouldShowPlayerVerificationReminder(
        baseUser({
          role: 'player',
          player_verification: {
            identity: { status: 'pending' },
            club_license: { status: 'not_submitted' },
          },
        })
      )
    ).toBe(false);
    expect(
      shouldShowPlayerVerificationReminder(
        baseUser({
          role: 'player',
          player_verification: {
            identity: { status: 'not_submitted' },
            club_license: { status: 'not_submitted' },
          },
        })
      )
    ).toBe(true);
  });
});
