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
    role === 'recruiter'
  );
}

export function isClubRole(role: UserRole): boolean {
  return role === 'club';
}

/**
 * Branding club (logo / couleurs) : tout compte rôle Club rattaché au clubId
 * (accès pôle Club), pas seulement le owner_uid.
 */
export function canEditClubBranding(
  role: UserRole | null | undefined,
  actorClubId: string | null | undefined,
  targetClubId: string | null | undefined,
): boolean {
  return (
    role === 'club' &&
    Boolean(actorClubId) &&
    Boolean(targetClubId) &&
    actorClubId === targetClubId
  );
}

/** Proposer / accepter un match amical entre clubs. */
export function canProposeFriendlyMatch(role: UserRole): boolean {
  return role === 'club' || role === 'coach';
}

/** Création / rattachement entité club */
export function canManageClubEntity(role: UserRole): boolean {
  return role === 'club' || role === 'coach' || role === 'agent';
}

/** Gestion effectif / planning équipe (club, coach). */
export function isOrganizerCapable(role: UserRole): boolean {
  return role === 'club' || role === 'coach';
}

/** Publication stages, annonces institutionnelles */
export function canPublishStages(role: UserRole): boolean {
  return role === 'club' || role === 'coach';
}

export function isStaffRole(role: UserRole): boolean {
  return (
    role !== 'player' &&
    role !== 'sponsor' &&
    role !== 'supporter' &&
    role !== 'parent'
  );
}
