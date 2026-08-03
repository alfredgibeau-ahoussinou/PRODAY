import type { User } from '../models/User';
import type { ContactViewerRelation } from '../models/ContactPrivacy';
import { filterContactFieldsForViewer } from './contactPrivacyVisibility';

/** Champs retirés lors de l’affichage d’un profil tiers (hors contacts filtrés). */
const STRIP_TOP_LEVEL = new Set([
  'parental_settings',
  'parental_runtime',
  'player_verification',
  'onboarding_documents_submitted',
]);

export type SanitizePublicUserOptions = {
  /**
   * Relation du viewer. Absente / stranger → contacts masqués (comportement historique).
   * Sinon email / phone / other_contact suivent `contact_privacy`.
   */
  viewerRelation?: ContactViewerRelation;
};

/**
 * Retourne une copie du profil sans données personnelles sensibles.
 * Les coordonnées respectent `contact_privacy` lorsque `viewerRelation` est fourni.
 */
export function sanitizePublicUser(
  user: User,
  options?: SanitizePublicUserOptions,
): User {
  const next: User = { ...user };
  for (const key of STRIP_TOP_LEVEL) {
    delete (next as unknown as Record<string, unknown>)[key];
  }

  const relation = options?.viewerRelation ?? 'stranger';
  const contactSource = {
    phone: user.phone ?? (user.profile as { phone?: string } | undefined)?.phone,
    email: user.email,
    other_contact: user.other_contact,
  };
  const visible = filterContactFieldsForViewer(
    contactSource,
    user.contact_privacy,
    relation,
  );

  if (visible.email) {
    next.email = visible.email;
  } else {
    delete (next as unknown as Record<string, unknown>).email;
  }

  if (visible.phone) {
    next.phone = visible.phone;
  } else {
    delete (next as unknown as Record<string, unknown>).phone;
  }

  if (visible.other_contact) {
    next.other_contact = visible.other_contact;
  } else {
    delete (next as unknown as Record<string, unknown>).other_contact;
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
