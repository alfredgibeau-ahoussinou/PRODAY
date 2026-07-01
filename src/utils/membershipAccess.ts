import type { User } from '../models/User';
import type { Membership } from '../models/Membership';
import type { TeamEvent } from '../models/TeamEvent';

/** Affiliation club validée — seule source de vérité pour convocations. */
export function hasActiveClubMembership(
  _profile: User,
  membership?: Membership | null,
): boolean {
  return membership?.status === 'active';
}

export function hasPendingClubMembership(membership?: Membership | null): boolean {
  return membership?.status === 'pending';
}

/** Événement visible pour un joueur amateur (membership active ou convocation directe). */
export function canViewTeamEventAsPlayer(
  profile: User,
  membership: Membership | null | undefined,
  event: TeamEvent,
): boolean {
  if (hasActiveClubMembership(profile, membership)) return true;
  return (
    event.invitee_uids.includes(profile.uid) ||
    profile.uid === event.organizer_uid ||
    event.event_type === 'detection'
  );
}

/** RSVP autorisé uniquement avec affiliation active (ou convocation explicite). */
export function canRespondToTeamEvent(
  profile: User,
  membership: Membership | null | undefined,
  event: TeamEvent,
): boolean {
  if (hasActiveClubMembership(profile, membership)) return true;
  return (
    event.invitee_uids.includes(profile.uid) ||
    profile.uid === event.organizer_uid ||
    event.event_type === 'detection'
  );
}
