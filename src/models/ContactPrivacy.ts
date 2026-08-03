/**
 * Confidentialité des coordonnées — l'utilisateur choisit qui voit quoi.
 */

export type ContactFieldId = 'phone' | 'email' | 'other';

/** Audience autorisée à voir un champ de contact. */
export type ContactVisibilityAudience =
  | 'nobody'
  | 'me'
  | 'club_staff'
  | 'agents'
  | 'recruiters'
  | 'connections'
  | 'everyone';

export interface ContactFieldPrivacy {
  field: ContactFieldId;
  /** Qui peut voir ce champ (hors soi — toujours visible pour le propriétaire). */
  visibleTo: ContactVisibilityAudience[];
}

export interface ContactPrivacySettings {
  phone: ContactVisibilityAudience[];
  email: ContactVisibilityAudience[];
  /** Autre moyen (Instagram, site, etc. stocké hors email/phone). */
  other: ContactVisibilityAudience[];
}

export const DEFAULT_CONTACT_PRIVACY: ContactPrivacySettings = {
  phone: ['club_staff', 'connections'],
  email: ['club_staff', 'agents', 'recruiters', 'connections'],
  other: ['connections'],
};

export type ContactViewerRelation =
  | 'self'
  | 'club_staff'
  | 'agent'
  | 'recruiter'
  | 'connection'
  | 'stranger';
