import type { UserRole } from '../models/User';

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
  parent: 'Parent',
};

/** Publication annonces Mercato — joueurs exclus. */
export function canPublishRecruitmentPost(role: UserRole): boolean {
  return (
    role === 'club' ||
    role === 'coach' ||
    role === 'agent' ||
    role === 'recruiter' ||
    role === 'organizer'
  );
}

export function isClubRole(role: UserRole): boolean {
  return role === 'club';
}

/** Proposer / accepter un match amical entre clubs. */
export function canProposeFriendlyMatch(role: UserRole): boolean {
  return role === 'club' || role === 'coach' || role === 'organizer';
}

/** Création / rattachement entité club */
export function canManageClubEntity(role: UserRole): boolean {
  return role === 'club' || role === 'coach' || role === 'organizer' || role === 'agent';
}

/** Gestion effectif / planning équipe (club, coach, organisateur). */
export function isOrganizerCapable(role: UserRole): boolean {
  return role === 'club' || role === 'coach' || role === 'organizer';
}

/** Publication stages, annonces institutionnelles */
export function canPublishStages(role: UserRole): boolean {
  return role === 'club' || role === 'organizer' || role === 'coach';
}

export function isStaffRole(role: UserRole): boolean {
  return (
    role !== 'player' &&
    role !== 'sponsor' &&
    role !== 'supporter' &&
    role !== 'parent'
  );
}
