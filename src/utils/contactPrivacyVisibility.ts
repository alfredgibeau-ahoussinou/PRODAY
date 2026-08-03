import {
  DEFAULT_CONTACT_PRIVACY,
  type ContactFieldId,
  type ContactPrivacySettings,
  type ContactViewerRelation,
  type ContactVisibilityAudience,
} from '../models/ContactPrivacy';
import type { UserRole } from '../models/User';

function audiencesForField(
  settings: ContactPrivacySettings | undefined,
  field: ContactFieldId,
): ContactVisibilityAudience[] {
  const source = settings ?? DEFAULT_CONTACT_PRIVACY;
  return source[field] ?? DEFAULT_CONTACT_PRIVACY[field];
}

function relationMatchesAudience(
  relation: ContactViewerRelation,
  audience: ContactVisibilityAudience,
): boolean {
  switch (audience) {
    case 'nobody':
      return false;
    case 'me':
      return relation === 'self';
    case 'club_staff':
      return relation === 'club_staff';
    case 'agents':
      return relation === 'agent';
    case 'recruiters':
      return relation === 'recruiter';
    case 'connections':
      return relation === 'connection';
    case 'everyone':
      return true;
    default:
      return false;
  }
}

/**
 * Indique si le viewer peut voir un champ de contact du profil cible.
 * Le propriétaire voit toujours ses propres coordonnées.
 */
export function canViewContactField(input: {
  field: ContactFieldId;
  settings?: ContactPrivacySettings;
  viewerRelation: ContactViewerRelation;
}): boolean {
  if (input.viewerRelation === 'self') return true;

  const audiences = audiencesForField(input.settings, input.field);
  if (audiences.includes('nobody') && audiences.length === 1) return false;
  if (audiences.includes('everyone')) return true;

  return audiences.some((a) => relationMatchesAudience(input.viewerRelation, a));
}

/** Masque les champs non autorisés pour un affichage public. */
export function filterContactFieldsForViewer<T extends { phone?: string; email?: string; other_contact?: string }>(
  contact: T,
  settings: ContactPrivacySettings | undefined,
  viewerRelation: ContactViewerRelation,
): Partial<T> {
  const out: Partial<T> = { ...contact };
  if (!canViewContactField({ field: 'phone', settings, viewerRelation })) {
    delete out.phone;
  }
  if (!canViewContactField({ field: 'email', settings, viewerRelation })) {
    delete out.email;
  }
  if (!canViewContactField({ field: 'other', settings, viewerRelation })) {
    delete (out as { other_contact?: string }).other_contact;
  }
  return out;
}

export function normalizeContactPrivacy(
  partial?: Partial<ContactPrivacySettings> | null,
): ContactPrivacySettings {
  return {
    phone: partial?.phone?.length ? [...partial.phone] : [...DEFAULT_CONTACT_PRIVACY.phone],
    email: partial?.email?.length ? [...partial.email] : [...DEFAULT_CONTACT_PRIVACY.email],
    other: partial?.other?.length ? [...partial.other] : [...DEFAULT_CONTACT_PRIVACY.other],
  };
}

/**
 * Relation viewer → profil cible pour appliquer `contact_privacy`.
 * Priorité : self > rôle métier > connexion > stranger.
 */
export function resolveContactViewerRelation(input: {
  targetUid: string;
  viewerUid?: string | null;
  viewerRole?: UserRole | null;
  isConnection?: boolean;
}): ContactViewerRelation {
  if (input.viewerUid && input.viewerUid === input.targetUid) return 'self';
  if (!input.viewerUid) return 'stranger';

  switch (input.viewerRole) {
    case 'agent':
      return 'agent';
    case 'recruiter':
      return 'recruiter';
    case 'coach':
    case 'club':
      return 'club_staff';
    default:
      break;
  }

  if (input.isConnection) return 'connection';
  return 'stranger';
}
