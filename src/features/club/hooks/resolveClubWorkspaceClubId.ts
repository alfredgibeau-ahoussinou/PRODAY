import type { UserRole } from '../../../models/User';

/**
 * Résout l’id club pour le workspace Pôle Club.
 * - Priorité : `profile.club_id`
 * - Fallback prod : compte rôle `club` propriétaire d’un doc clubs (owner_uid)
 *   même si le profil n’a pas encore été backfillé (signup club ne créait pas le lien).
 */
export async function resolveClubWorkspaceClubId(opts: {
  profileClubId: string | null | undefined;
  role?: UserRole | null;
  uid?: string | null;
  getByOwner: (uid: string) => Promise<{ id: string } | null>;
}): Promise<{ clubId: string | null; shouldBackfill: boolean }> {
  const fromProfile = opts.profileClubId?.trim() || null;
  if (fromProfile) {
    return { clubId: fromProfile, shouldBackfill: false };
  }
  if (opts.role !== 'club' || !opts.uid) {
    return { clubId: null, shouldBackfill: false };
  }
  try {
    const owned = await opts.getByOwner(opts.uid);
    if (owned?.id) {
      return { clubId: owned.id, shouldBackfill: true };
    }
  } catch {
    // ignore — empty workspace
  }
  return { clubId: null, shouldBackfill: false };
}
