import type { UserRole } from '../../../models/User';

export type PresidentAccessInput = {
  role: UserRole | null | undefined;
  uid: string | null | undefined;
  /** Club rattaché au profil (profile.club_id). */
  clubId: string | null | undefined;
  /** owner_uid du document club — compte président. */
  clubOwnerUid?: string | null | undefined;
};

export const PRESIDENT_POLE_DENIED_TITLE = 'Accès refusé';

export const PRESIDENT_POLE_DENIED_BODY =
  'Le Pôle Président est réservé au compte président de ce club.';

/**
 * Gate Pôle Président.
 * Uniquement le compte président = rôle `club` + `uid === club.owner_uid`.
 * Staff club (même rôle `club`, non owner) et autres rôles : refusés.
 * Sans `clubOwnerUid` connu : refus (fail closed) — attendre le chargement côté UI.
 */
export function canAccessPresidentPole(input: PresidentAccessInput): boolean {
  const { role, uid, clubId, clubOwnerUid } = input;
  if (!uid || !clubId || role !== 'club') return false;
  if (!clubOwnerUid) return false;
  return clubOwnerUid === uid;
}
