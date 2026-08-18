import type {
  PlayerVerificationState,
  User,
  VerificationStatus,
} from '../models/User';
import {
  ROLES_REQUIRING_VERIFICATION,
  computePlayerVerificationStatus,
  defaultPlayerVerificationState,
} from '../models/User';

const VERIFY_LABELS: Record<VerificationStatus, string> = {
  NOT_REQUIRED: 'Non requise',
  PENDING: 'En attente',
  VERIFIED: 'Vérifié',
  REJECTED: 'Refusé',
};

/**
 * Compte en attente de revue admin (staff, joueur ou sponsor).
 * Joueurs : `player_verification` doit être synchronisé lors d’un validate/refuse
 * (callable `validateProfile` ou `validateProfileDirect`) — sinon des checks
 * `pending` laissent la bannière « revue manuelle » visible malgré VERIFIED.
 */
export function userNeedsAdminVerificationReview(user: User): boolean {
  if (user.role === 'sponsor') {
    if (user.verification_status === 'REJECTED') return false;
    if (user.verification_status === 'PENDING') return true;
    return user.sponsor_approved !== true;
  }
  if (user.role === 'player') {
    if (user.verification_status === 'PENDING') return true;
    if (user.player_verification) {
      return computePlayerVerificationStatus(user.player_verification) === 'PENDING';
    }
    return false;
  }
  if (!ROLES_REQUIRING_VERIFICATION.includes(user.role)) return false;
  return user.verification_status === 'PENDING';
}

/** Statut effectif affiché côté admin (verification_status + player_verification). */
export function adminEffectiveVerificationStatus(user: User): VerificationStatus {
  if (user.role === 'player' && user.player_verification) {
    if (user.verification_status === 'VERIFIED') return 'VERIFIED';
    if (user.verification_status === 'REJECTED') return 'REJECTED';
    return computePlayerVerificationStatus(user.player_verification);
  }
  return user.verification_status ?? 'NOT_REQUIRED';
}

export function adminEffectiveVerificationLabel(user: User): string {
  return VERIFY_LABELS[adminEffectiveVerificationStatus(user)];
}

/** Applique une décision admin sur les checks joueur encore en pending. */
export function applyAdminPlayerVerificationDecision(
  existing: PlayerVerificationState | undefined,
  action: 'approve' | 'reject',
  rejectionReason?: string,
): {
  player_verification: PlayerVerificationState;
  verification_status: VerificationStatus;
  onboarding_documents_submitted?: boolean;
} | null {
  if (!existing) return null;

  const verified = action === 'approve';
  const checkStatus = verified ? 'verified' : 'rejected';
  const pv = {
    ...defaultPlayerVerificationState(false),
    ...existing,
  };

  (['identity', 'club_license', 'parental_consent'] as const).forEach((key) => {
    const check = pv[key];
    if (check?.status === 'pending') {
      pv[key] = {
        ...check,
        status: checkStatus,
        ...(verified
          ? {}
          : {
              rejection_reason:
                rejectionReason?.trim() || 'Refusé par l’administrateur',
            }),
      };
    }
  });

  return {
    player_verification: pv,
    verification_status: verified ? 'VERIFIED' : computePlayerVerificationStatus(pv),
    ...(verified ? { onboarding_documents_submitted: true } : {}),
  };
}
