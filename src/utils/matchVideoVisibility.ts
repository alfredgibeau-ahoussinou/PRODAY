/**
 * Règle de visibilité des captations match (VEO-03) — pure et testable.
 *
 * « Joueur et parent seulement si explicitement autorisé » : le rôle du lecteur
 * est converti en audience cible, puis une captation n'est visible que si
 * `share_with` inclut explicitement cette audience. Staff/club/admin voient
 * tout. Champs absents => règle stricte (rien n'est visible sans partage
 * explicite), jamais une visibilité inventée.
 */
import type { User } from '../models/User';
import type { MatchVideoShareAudience } from '../models/ClubCameras';

/** Audience de partage cible pour le rôle du lecteur. */
export function captureAudienceForRole(
  role: User['role'] | undefined,
): MatchVideoShareAudience {
  switch (role) {
    case 'coach':
      return 'coaches';
    case 'player':
      return 'players';
    case 'parent':
      return 'parents';
    default:
      return 'staff';
  }
}

/** Staff réel (club/admin/organizer…) : voit toutes les captations du club. */
export function isStaffRole(role: User['role'] | undefined): boolean {
  return !['coach', 'player', 'parent'].includes(role as User['role']);
}

/**
 * Une captation est-elle visible pour ce rôle ?
 * - Staff : toujours.
 * - Autres rôles : uniquement si `share_with` inclut explicitement leur
 *   audience. Sans `share_with` => invisible (stricte par défaut).
 */
export function isCaptureVisibleForRole(
  video: { share_with?: MatchVideoShareAudience[] },
  role: User['role'] | undefined,
): boolean {
  if (isStaffRole(role)) return true;
  const audience = captureAudienceForRole(role);
  return (video.share_with ?? []).includes(audience);
}

/**
 * Filtre une liste de captations selon le rôle du lecteur. Les entrées
 * invalides ne rendent jamais une captation visible.
 */
export function filterCapturesForRole<T extends { share_with?: MatchVideoShareAudience[] }>(
  videos: readonly T[],
  role: User['role'] | undefined,
): T[] {
  return videos.filter((video) => isCaptureVisibleForRole(video, role));
}
