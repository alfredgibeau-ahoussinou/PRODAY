import type { TeamEvent } from '../models/TeamEvent';
import type { User } from '../models/User';

/** Lecture calendrier / hub — staff + compte club (vitrine structure). */
const CLUB_STAFF_ROLES = new Set(['coach', 'organizer', 'agent', 'club', 'recruiter']);
/** Gestion convocations / live / stats — Pôle Staff & Dirigeants Club. */
const MANAGE_STAFF_ROLES = new Set(['coach', 'organizer', 'agent']);

export interface SupporterFollowContext {
  clubIds: Set<string>;
  tournamentIds: Set<string>;
}

/** Tribune — matchs des clubs ou tournois suivis. */
export function canViewTeamEventAsSupporter(
  event: TeamEvent,
  context: SupporterFollowContext,
): boolean {
  if (event.tournament_id && context.tournamentIds.has(event.tournament_id)) return true;
  if (event.club_id && context.clubIds.has(event.club_id)) return true;
  return false;
}

/** Accès lecture au hub match (composition, live, stats internes). */
export function canViewTeamEvent(
  event: TeamEvent,
  profile: User | null | undefined,
  options?: { isAdmin?: boolean; supporterFollow?: SupporterFollowContext },
): boolean {
  if (!profile) return false;
  if (options?.isAdmin) return true;
  if (event.organizer_uid === profile.uid) return true;
  if (event.invitee_uids.includes(profile.uid)) return true;
  if (event.event_type === 'detection') return true;
  if (profile.role === 'supporter') {
    if (event.tournament_id) return true;
    if (options?.supporterFollow && canViewTeamEventAsSupporter(event, options.supporterFollow)) {
      return true;
    }
    return false;
  }
  const clubId = profile.profile?.club_id;
  if (clubId && event.club_id && clubId === event.club_id && CLUB_STAFF_ROLES.has(profile.role)) {
    return true;
  }
  return false;
}

/** Réponse RSVP / participation à une convocation. */
export function canRespondToTeamEvent(event: TeamEvent, profile: User): boolean {
  if (event.organizer_uid === profile.uid) return true;
  if (event.invitee_uids.includes(profile.uid)) return true;
  if (event.event_type === 'detection') return true;
  return false;
}

export function assertTeamEventRsvpAccess(event: TeamEvent, uid: string): void {
  if (event.organizer_uid === uid) return;
  if (event.invitee_uids.includes(uid)) return;
  if (event.event_type === 'detection') return;
  throw new Error('Vous n’êtes pas convoqué à cet événement.');
}

/** Gestion live, composition, pointage, covoiturage staff. */
export function canManageTeamEvent(
  event: TeamEvent,
  profile: User | null | undefined,
  options?: { isAdmin?: boolean },
): boolean {
  if (!profile) return false;
  if (options?.isAdmin || profile.is_admin) return true;
  if (event.organizer_uid === profile.uid) return true;
  const clubId = profile.profile?.club_id;
  if (clubId && event.club_id && clubId === event.club_id && MANAGE_STAFF_ROLES.has(profile.role)) {
    return true;
  }
  return false;
}

export function assertTeamEventManageAccess(
  event: TeamEvent,
  profile: User,
  options?: { isAdmin?: boolean; allowWhenReportLocked?: boolean },
): void {
  if (!canManageTeamEvent(event, profile, options)) {
    throw new Error('Action réservée à l’organisateur ou au staff du club.');
  }
  if (event.match_report_finalized_at && !options?.allowWhenReportLocked && !options?.isAdmin) {
    throw new Error('Le rapport de match est verrouillé.');
  }
}
