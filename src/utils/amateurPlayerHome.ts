import type { User } from '../models/User';
import type { Membership } from '../models/Membership';
import type { TeamEvent } from '../models/TeamEvent';
import {
  EVENT_TYPE_LABELS,
  RSVP_STATUS_LABELS,
  isCoachMatchEvent,
  isCoachTrainingEvent,
  isComingRsvp,
  isLateRsvp,
  userRsvp,
  type RsvpStatus,
} from '../models/TeamEvent';
import { isInMatchWindow } from './matchLive';

/** Joueur amateur sans adhésion active ou en attente (ignore profile.club_id legacy). */
export function isAmateurPlayerWithoutClub(
  profile: User,
  activeMembership: Membership | null,
): boolean {
  if (
    activeMembership &&
    (activeMembership.status === 'active' || activeMembership.status === 'pending')
  ) {
    return false;
  }
  return true;
}

export function getUpcomingTeamEvents(events: TeamEvent[], now = Date.now()): TeamEvent[] {
  return [...events]
    .filter((e) => e.starts_at.getTime() > now || isInMatchWindow(e))
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
}

export function getNextTeamEvent(events: TeamEvent[], now = Date.now()): TeamEvent | null {
  return getUpcomingTeamEvents(events, now)[0] ?? null;
}

export function getNextMatchEvent(events: TeamEvent[], now = Date.now()): TeamEvent | null {
  return getUpcomingTeamEvents(events, now).find((e) => isCoachMatchEvent(e)) ?? null;
}

export function getNextTrainingEvent(events: TeamEvent[], now = Date.now()): TeamEvent | null {
  return getUpcomingTeamEvents(events, now).find((e) => isCoachTrainingEvent(e)) ?? null;
}

/** Places covoiturage restantes sur un événement (null si aucun slot). */
export function countRemainingCarpoolSeats(event: TeamEvent): number | null {
  if (!event.carpool_slots?.length) return null;
  let remaining = 0;
  for (const slot of event.carpool_slots) {
    const seats = slot.seats ?? 0;
    const taken =
      slot.passengers?.filter(
        (p) => p.status !== 'cancelled' && p.status !== 'rejected',
      ).length ?? 0;
    remaining += Math.max(0, seats - taken);
  }
  return remaining;
}

export type PlayerDayPriority =
  | { kind: 'live'; event: TeamEvent }
  | { kind: 'match'; event: TeamEvent }
  | { kind: 'training'; event: TeamEvent }
  | { kind: 'other'; event: TeamEvent }
  | { kind: 'calm' };

/** Priorité Accueil joueur — live > prochain événement (match si égal chrono). */
export function resolvePlayerDayPriority(
  events: TeamEvent[],
  now = Date.now(),
): PlayerDayPriority {
  const live = events.find((e) => isInMatchWindow(e));
  if (live) return { kind: 'live', event: live };

  const next = getNextTeamEvent(events, now);
  if (!next) return { kind: 'calm' };
  if (isCoachMatchEvent(next)) return { kind: 'match', event: next };
  if (isCoachTrainingEvent(next)) return { kind: 'training', event: next };
  return { kind: 'other', event: next };
}

export type PlayerRsvpChoice = 'yes' | 'no' | 'maybe';

export function needsPlayerRsvpResponse(status?: RsvpStatus | null): boolean {
  return !status || status === 'pending';
}

export function playerRsvpStatusLabel(status?: RsvpStatus | null): string {
  if (!status || status === 'pending') return 'À confirmer';
  return RSVP_STATUS_LABELS[status] ?? status;
}

export function playerRsvpSuccessCopy(status: RsvpStatus): string {
  if (isComingRsvp(status)) return 'Présence confirmée — le coach est prévenu.';
  if (status === 'no') return 'Absence enregistrée — le coach est prévenu.';
  if (status === 'maybe') return 'Réponse « peut-être » enregistrée.';
  return 'Réponse enregistrée.';
}

export function resolvePlayerEventRsvp(event: TeamEvent, uid: string): RsvpStatus {
  return userRsvp(event, uid);
}

export function playerDayPriorityKicker(kind: PlayerDayPriority['kind']): string {
  if (kind === 'live') return 'En direct';
  if (kind === 'match') return 'Match day';
  if (kind === 'training') return 'Séance';
  if (kind === 'other') return 'Convocation';
  return 'Agenda';
}

export function formatPlayerEventWhen(startsAt: Date): string {
  return startsAt.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPlayerEventType(event: TeamEvent): string {
  return EVENT_TYPE_LABELS[event.event_type] ?? event.event_type;
}

export function playerCanShowRsvp(event: TeamEvent, uid: string): boolean {
  return (
    event.invitee_uids.includes(uid) ||
    Boolean(event.rsvps?.[uid]) ||
    event.event_type === 'detection'
  );
}

export function isPlayerRsvpYesSelected(status?: RsvpStatus | null): boolean {
  return status === 'yes' || (!!status && isLateRsvp(status));
}
