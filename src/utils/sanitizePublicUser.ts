import type { User } from '../models/User';

/** Champs retirés lors de l’affichage d’un profil tiers. */
const STRIP_TOP_LEVEL = new Set([
  'email',
  'phone',
  'parental_settings',
  'parental_runtime',
  'player_verification',
  'onboarding_documents_submitted',
]);

/**
 * Retourne une copie du profil sans données personnelles sensibles
 * (email, téléphone, contrôle parental, vérification).
 */
export function sanitizePublicUser(user: User): User {
  const next: User = { ...user };
  for (const key of STRIP_TOP_LEVEL) {
    delete (next as unknown as Record<string, unknown>)[key];
  }
  if (next.profile) {
    next.profile = { ...next.profile };
    delete (next.profile as unknown as Record<string, unknown>).phone;
  }
  return next;
}

export function shouldSanitizeUserProfile(targetUid: string, viewerUid?: string | null): boolean {
  if (!viewerUid) return true;
  return targetUid !== viewerUid;
}
