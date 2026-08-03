import type { PlayerVerificationState, User } from '../models/User';

/**
 * Badge « Joueur vérifié » :
 * licence vérifiée OU certification validée par le club.
 */
export type ProPlayerVerificationSource =
  | 'license'
  | 'club_certification'
  | 'both'
  | null;

export function isPlayerLicenseVerified(
  state: PlayerVerificationState | undefined,
): boolean {
  return state?.club_license?.status === 'verified';
}

export function isClubCertificationVerified(
  user: Pick<User, 'club_certification_verified' | 'is_verified' | 'verification_status'>,
): boolean {
  if (user.club_certification_verified === true) return true;
  return user.is_verified === true && user.verification_status === 'VERIFIED';
}

export function resolveProPlayerVerificationSource(
  user: Pick<
    User,
    | 'player_verification'
    | 'club_certification_verified'
    | 'is_verified'
    | 'verification_status'
    | 'role'
  >,
): ProPlayerVerificationSource {
  if (user.role !== 'player') return null;
  const license = isPlayerLicenseVerified(user.player_verification);
  const club = isClubCertificationVerified(user);
  if (license && club) return 'both';
  if (license) return 'license';
  if (club) return 'club_certification';
  return null;
}

export function hasJoueurVerifieBadge(
  user: Pick<
    User,
    | 'player_verification'
    | 'club_certification_verified'
    | 'is_verified'
    | 'verification_status'
    | 'role'
  >,
): boolean {
  return resolveProPlayerVerificationSource(user) != null;
}

export const JOUEUR_VERIFIE_BADGE = {
  id: 'joueur_verifie' as const,
  label: 'Joueur vérifié',
  shortLabel: 'Vérifié',
  colorHex: '#0EA5E9',
};
