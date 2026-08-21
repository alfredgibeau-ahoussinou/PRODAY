import type { UserRole } from '../../../models/User';

export type PresidentAccessInput = {
  role: UserRole | null | undefined;
  uid: string | null | undefined;
  /** Club rattaché au profil (profile.club_id). */
  clubId: string | null | undefined;
  /** owner_uid du document club — président de facto. */
  clubOwnerUid?: string | null | undefined;
  /**
   * Variante large : tout compte rôle `club` rattaché (dirigeant).
   * Variante stricte : owner uniquement (`requireOwner: true`).
   */
  requireOwner?: boolean;
};

/**
 * Gate Pôle Président.
 * v1 large : tout compte `role === 'club'` rattaché à un club
 * (même ACL que branding / copilote Club). Owner toujours autorisé.
 */
export function canAccessPresidentPole(input: PresidentAccessInput): boolean {
  const { role, uid, clubId, clubOwnerUid, requireOwner = false } = input;
  if (!uid || !clubId || role !== 'club') return false;
  if (clubOwnerUid && clubOwnerUid === uid) return true;
  if (requireOwner) return false;
  return true;
}
