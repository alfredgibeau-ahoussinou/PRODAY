import type { UserRole } from '../models/User';

export { canPublishRecruitmentPost } from '../content/poleExperience';

export const ROLE_LABELS: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  agent: 'Agent',
  recruiter: 'Recruteur',
  organizer: 'Organisateur',
  sponsor: 'Sponsor',
  supporter: 'Supporter',
  physio: 'Pôle médical',
};

export function isClubRole(role: UserRole): boolean {
  return role === 'club';
}

/**
 * Gestion d'équipe, convocations, détections (banc technique / orga).
 * Le président (rôle club) gère l'image et la structure, pas l'effectif coach.
 */
export function isOrganizerCapable(role: UserRole): boolean {
  return role === 'coach' || role === 'organizer' || role === 'agent';
}

/** Création / rattachement entité club — réservé aux dirigeants (pôle Club). */
export function canManageClubEntity(role: UserRole): boolean {
  return role === 'club';
}

/** Publication stages / annonces institutionnelles — pôle Club (+ orga événements). */
export function canPublishStages(role: UserRole): boolean {
  return role === 'club' || role === 'organizer';
}

export function isStaffRole(role: UserRole): boolean {
  return role !== 'player' && role !== 'sponsor' && role !== 'supporter';
}

/** Message d'exclusivité Club ↔ Staff (pôles incompatibles). */
export function poleExclusivityNote(pole: 'pro_club' | 'pro_staff'): string {
  if (pole === 'pro_club') {
    return 'Pôle Club uniquement — réservé aux présidents et dirigeants. Incompatible avec le pôle Staff.';
  }
  return 'Pôle Staff uniquement — coachs et staff technique. Incompatible avec le pôle Club.';
}
