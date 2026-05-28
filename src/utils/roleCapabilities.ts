import type { UserRole } from '../models/User';

export const ROLE_LABELS: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  agent: 'Agent',
  organizer: 'Organisateur',
  sponsor: 'Partenaire',
  physio: 'Kinésithérapeute',
};

export function isClubRole(role: UserRole): boolean {
  return role === 'club';
}

/** Gestion d'équipe, convocations, détections, stages */
export function isOrganizerCapable(role: UserRole): boolean {
  return role === 'coach' || role === 'organizer' || role === 'club' || role === 'agent';
}

/** Création / rattachement entité club */
export function canManageClubEntity(role: UserRole): boolean {
  return role === 'club' || role === 'coach' || role === 'organizer' || role === 'agent';
}

/** Publication stages, annonces institutionnelles */
export function canPublishStages(role: UserRole): boolean {
  return role === 'club' || role === 'organizer' || role === 'coach';
}

export function isStaffRole(role: UserRole): boolean {
  return role !== 'player' && role !== 'sponsor';
}
