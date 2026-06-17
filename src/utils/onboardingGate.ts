import type { User, UserRole } from '../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';
import { isOnboardingDocumentsBypassed } from '../config/emailVerificationBypass';

/** Rôles qui doivent téléverser des justificatifs depuis l’espace profil. */
export const ROLES_REQUIRING_ONBOARDING_DOCUMENTS: UserRole[] = [
  'player',
  ...ROLES_REQUIRING_VERIFICATION,
  'physio',
];

/** Navigation libre — seule la messagerie reste bloquée sans documents. */
export function isNavigationLockedUntilDocuments(_user: User): boolean {
  return false;
}

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

/** Bandeau « Vérification joueur » — licence club une fois l’identité soumise. */
export function shouldShowPlayerVerificationReminder(user: User): boolean {
  if (user.role !== 'player') return false;
  if (isOnboardingDocumentsBypassed(user.email)) return false;
  if (needsOnboardingDocumentUpload(user)) return false;

  const identityStatus = user.player_verification?.identity?.status ?? 'not_submitted';
  if (identityStatus !== 'verified' && identityStatus !== 'pending') return false;

  const licenseStatus = user.player_verification?.club_license?.status ?? 'not_submitted';
  return licenseStatus !== 'verified' && licenseStatus !== 'pending';
}
