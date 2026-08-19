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

      const after = {
        ...before,
        verification_status: patch.verification_status,
        is_verified: patch.is_verified,
        player_verification: patch.player_verification,
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

    it('ne signale pas un joueur VERIFIED même si les checks sont encore pending', () => {
      const user = playerWithPendingChecks({ verification_status: 'VERIFIED' });
      expect(userNeedsAdminVerificationReview(user)).toBe(false);
    });

    it('ne signale pas un joueur is_verified même si verification_status est PENDING', () => {
      const user = playerWithPendingChecks({
        is_verified: true,
        verification_status: 'PENDING',
      });
      expect(userNeedsAdminVerificationReview(user)).toBe(false);
    });

    it('ne signale pas un joueur REJECTED', () => {
      const user = playerWithPendingChecks({
        verification_status: 'REJECTED',
        player_verification: {
          identity: { status: 'rejected' },
          club_license: { status: 'pending' },
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
      expect(patch.verification_status).toBe('VERIFIED');
      expect(patch.is_verified).toBe(true);
      expect(patch.player_verification.identity.status).toBe('verified');
      expect(patch.player_verification.club_license.status).toBe('verified');
      expect(patch.player_verification.parental_consent?.status).toBe('verified');
      expect(patch.onboarding_documents_submitted).toBe(true);
    });

    it('crée un état par défaut puis valide si player_verification est absent', () => {
      const patch = applyAdminPlayerVerificationDecision(undefined, 'approve');
      expect(patch.verification_status).toBe('VERIFIED');
      expect(patch.is_verified).toBe(true);
      expect(patch.player_verification.identity.status).toBe('verified');
      expect(patch.player_verification.club_license.status).toBe('verified');
      expect(userNeedsAdminVerificationReview({
        uid: 'p-new',
        role: 'player',
        verification_status: patch.verification_status,
        is_verified: patch.is_verified,
        player_verification: patch.player_verification,
      } as User)).toBe(false);
    });

    it('force verified même si les checks ne sont pas pending', () => {
      const patch = applyAdminPlayerVerificationDecision(
        {
          identity: { status: 'not_submitted' },
          club_license: { status: 'rejected' },
        },
        'approve',
      );
      expect(patch.verification_status).toBe('VERIFIED');
      expect(patch.player_verification.identity.status).toBe('verified');
      expect(patch.player_verification.club_license.status).toBe('verified');
      expect(userNeedsAdminVerificationReview({
        uid: 'p2',
        role: 'player',
        verification_status: patch.verification_status,
        is_verified: patch.is_verified,
        player_verification: patch.player_verification,
      } as User)).toBe(false);
    });

    it('rejette identity et licence même si elles n’étaient pas pending', () => {
      const patch = applyAdminPlayerVerificationDecision(
        {
          identity: { status: 'pending' },
          club_license: { status: 'verified' },
        },
        'reject',
        'Document illisible',
      );
      expect(patch.player_verification.identity.status).toBe('rejected');
      expect(patch.player_verification.club_license.status).toBe('rejected');
      expect(patch.player_verification.identity.rejection_reason).toBe('Document illisible');
      expect(patch.verification_status).toBe('REJECTED');
      expect(patch.is_verified).toBe(false);
    });
  });
});
