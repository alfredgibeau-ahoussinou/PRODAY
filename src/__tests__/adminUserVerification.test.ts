import type { User } from '../models/User';
import {
  adminEffectiveVerificationLabel,
  adminEffectiveVerificationStatus,
  applyAdminPlayerVerificationDecision,
  userNeedsAdminVerificationReview,
} from '../utils/adminUserVerification';

function playerWithPendingChecks(overrides: Partial<User> = {}): User {
  return {
    uid: 'p1',
    role: 'player',
    verification_status: 'PENDING',
    player_verification: {
      identity: { status: 'pending' },
      club_license: { status: 'pending' },
    },
    ...overrides,
  } as User;
}

describe('adminUserVerification', () => {
  describe('userNeedsAdminVerificationReview', () => {
    it('signale un joueur avec checks pending', () => {
      expect(userNeedsAdminVerificationReview(playerWithPendingChecks())).toBe(true);
    });

    it('ne signale plus un joueur après sync admin approve', () => {
      const before = playerWithPendingChecks();
      expect(userNeedsAdminVerificationReview(before)).toBe(true);

      const patch = applyAdminPlayerVerificationDecision(
        before.player_verification,
        'approve',
      );
      expect(patch).not.toBeNull();

      const after = {
        ...before,
        verification_status: patch!.verification_status,
        player_verification: patch!.player_verification,
      } as User;

      expect(after.player_verification?.identity.status).toBe('verified');
      expect(after.player_verification?.club_license.status).toBe('verified');
      expect(userNeedsAdminVerificationReview(after)).toBe(false);
    });

    it('ne signale pas un joueur VERIFIED avec checks synchronisés', () => {
      const user = playerWithPendingChecks({
        verification_status: 'VERIFIED',
        player_verification: {
          identity: { status: 'verified' },
          club_license: { status: 'verified' },
        },
      });
      expect(userNeedsAdminVerificationReview(user)).toBe(false);
    });
  });

  describe('adminEffectiveVerificationStatus', () => {
    it('priorise VERIFIED quand verification_status est VERIFIED', () => {
      const user = playerWithPendingChecks({
        verification_status: 'VERIFIED',
        player_verification: {
          identity: { status: 'pending' },
          club_license: { status: 'pending' },
        },
      });
      expect(adminEffectiveVerificationStatus(user)).toBe('VERIFIED');
      expect(adminEffectiveVerificationLabel(user)).toBe('Vérifié');
    });

    it('reflete les checks pending quand le compte est encore en attente', () => {
      const user = playerWithPendingChecks();
      expect(adminEffectiveVerificationStatus(user)).toBe('PENDING');
      expect(adminEffectiveVerificationLabel(user)).toBe('En attente');
    });
  });

  describe('applyAdminPlayerVerificationDecision', () => {
    it('passe tous les checks pending en verified à l’approbation', () => {
      const patch = applyAdminPlayerVerificationDecision(
        {
          identity: { status: 'pending' },
          club_license: { status: 'pending' },
          parental_consent: { status: 'pending' },
        },
        'approve',
      );
      expect(patch?.verification_status).toBe('VERIFIED');
      expect(patch?.player_verification.identity.status).toBe('verified');
      expect(patch?.player_verification.club_license.status).toBe('verified');
      expect(patch?.player_verification.parental_consent?.status).toBe('verified');
      expect(patch?.onboarding_documents_submitted).toBe(true);
    });

    it('rejette les checks pending et calcule le statut agrégé', () => {
      const patch = applyAdminPlayerVerificationDecision(
        {
          identity: { status: 'pending' },
          club_license: { status: 'verified' },
        },
        'reject',
        'Document illisible',
      );
      expect(patch?.player_verification.identity.status).toBe('rejected');
      expect(patch?.player_verification.identity.rejection_reason).toBe('Document illisible');
      expect(patch?.verification_status).toBe('REJECTED');
    });
  });
});
