import type { User, UserRole } from '../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';

/** Rôles qui doivent téléverser des justificatifs avant la confirmation email. */
export const ROLES_REQUIRING_ONBOARDING_DOCUMENTS: UserRole[] = [
  'player',
  ...ROLES_REQUIRING_VERIFICATION,
  'physio',
];

export function needsOnboardingDocumentUpload(user: User): boolean {
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
