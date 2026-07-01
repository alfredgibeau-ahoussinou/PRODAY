import type { User } from '../models/User';
import type { Membership } from '../models/Membership';
import type { TeamEvent } from '../models/TeamEvent';

/** Joueur amateur sans club ni adhésion active/en attente. */
export function isAmateurPlayerWithoutClub(
  profile: User,
  activeMembership: Membership | null,
): boolean {
  if (profile.profile.club_id) return false;
  if (
    activeMembership &&
    (activeMembership.status === 'active' || activeMembership.status === 'pending')
  ) {
    return false;
  }
  return true;
}

export function getUpcomingTeamEvents(events: TeamEvent[]): TeamEvent[] {
  const now = Date.now();
  return [...events]
    .filter((e) => e.starts_at.getTime() > now)
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
}

export function getNextTeamEvent(events: TeamEvent[]): TeamEvent | null {
  return getUpcomingTeamEvents(events)[0] ?? null;
}

export function getNextMatchEvent(events: TeamEvent[]): TeamEvent | null {
  return (
    getUpcomingTeamEvents(events).find(
      (e) => e.event_type === 'friendly' || e.event_type === 'tournament',
    ) ?? null
  );
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
