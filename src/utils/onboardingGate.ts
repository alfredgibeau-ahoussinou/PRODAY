import type { User, UserRole } from '../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';
import { isOnboardingDocumentsBypassed } from '../config/emailVerificationBypass';

/** Rôles qui doivent téléverser des justificatifs avant la confirmation email. */
export const ROLES_REQUIRING_ONBOARDING_DOCUMENTS: UserRole[] = [
  'player',
  ...ROLES_REQUIRING_VERIFICATION,
  'physio',
];

export function needsOnboardingDocumentUpload(user: User): boolean {
  if (isOnboardingDocumentsBypassed(user.email)) return false;
  if (user.onboarding_documents_submitted) return false;
  if (!ROLES_REQUIRING_ONBOARDING_DOCUMENTS.includes(user.role)) return false;

  if (user.role === 'player') {
    const identityStatus = user.player_verification?.identity?.status;
    if (identityStatus === 'verified' || identityStatus === 'pending') {
      return false;
    }
  }

  return true;
}

/** Bandeau « Vérification joueur » sur le profil — pas si déjà fait à l’inscription. */
export function shouldShowPlayerVerificationReminder(user: User): boolean {
  if (user.role !== 'player') return false;
  if (isOnboardingDocumentsBypassed(user.email)) return false;
  if (user.onboarding_documents_submitted) return false;

  const identityStatus = user.player_verification?.identity?.status ?? 'not_submitted';
  if (identityStatus === 'verified' || identityStatus === 'pending') return false;

  return true;
}
