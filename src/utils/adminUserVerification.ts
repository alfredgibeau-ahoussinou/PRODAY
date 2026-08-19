import type {
  PlayerVerificationCheck,
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

export type AdminPlayerVerificationPatch = {
  player_verification: PlayerVerificationState;
  verification_status: VerificationStatus;
  is_verified: boolean;
  onboarding_documents_submitted?: boolean;
};

/**
 * Compte en attente de revue admin (staff, joueur ou sponsor).
 * Joueur : la décision admin (`VERIFIED` / `is_verified` / `REJECTED`) gagne
 * même si `player_verification` a encore des checks pending (ancien callable).
 */
export function userNeedsAdminVerificationReview(user: User): boolean {
  if (user.role === 'sponsor') {
    if (user.verification_status === 'REJECTED') return false;
    if (user.verification_status === 'PENDING') return true;
    return user.sponsor_approved !== true;
  }
  if (user.role === 'player') {
    if (user.verification_status === 'VERIFIED' || user.is_verified === true) return false;
    if (user.verification_status === 'REJECTED') return false;
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
    if (user.verification_status === 'VERIFIED' || user.is_verified === true) return 'VERIFIED';
    if (user.verification_status === 'REJECTED') return 'REJECTED';
    return computePlayerVerificationStatus(user.player_verification);
  }
  if (user.is_verified === true) return 'VERIFIED';
  return user.verification_status ?? 'NOT_REQUIRED';
}

export function adminEffectiveVerificationLabel(user: User): string {
  return VERIFY_LABELS[adminEffectiveVerificationStatus(user)];
}

function applyForcedCheck(
  check: PlayerVerificationCheck | undefined,
  status: 'verified' | 'rejected',
  rejectionReason?: string,
): PlayerVerificationCheck {
  const next: PlayerVerificationCheck = {
    ...(check ?? { status: 'not_submitted' }),
    status,
  };
  if (status === 'rejected') {
    next.rejection_reason = rejectionReason?.trim() || 'Refusé par l’administrateur';
  } else {
    delete next.rejection_reason;
  }
  return next;
}

/**
 * Applique une décision admin sur les checks joueur.
 * Crée un état par défaut si absent ; force identity / licence (pas seulement `pending`).
 */
export function applyAdminPlayerVerificationDecision(
  existing: PlayerVerificationState | undefined,
  action: 'approve' | 'reject',
  rejectionReason?: string,
): AdminPlayerVerificationPatch {
  const verified = action === 'approve';
  const checkStatus = verified ? 'verified' : 'rejected';
  const base = defaultPlayerVerificationState(Boolean(existing?.parental_consent));
  const pv: PlayerVerificationState = {
    ...base,
    ...existing,
    identity: applyForcedCheck(existing?.identity ?? base.identity, checkStatus, rejectionReason),
    club_license: applyForcedCheck(
      existing?.club_license ?? base.club_license,
      checkStatus,
      rejectionReason,
    ),
  };

  if (verified && (existing?.parental_consent || pv.parental_consent)) {
    pv.parental_consent = applyForcedCheck(
      existing?.parental_consent ?? pv.parental_consent,
      'verified',
    );
  }

  return {
    player_verification: pv,
    verification_status: verified ? 'VERIFIED' : 'REJECTED',
    is_verified: verified,
    ...(verified ? { onboarding_documents_submitted: true } : {}),
  };
}
