import type { CarpoolDriverBalance, CarpoolSlot, TeamEvent } from '../models/TeamEvent';

/** Agrège le nombre de trajets par conducteur sur une liste d’événements. */
export function aggregateCarpoolBalance(events: TeamEvent[]): CarpoolDriverBalance[] {
  const map = new Map<string, CarpoolDriverBalance>();

  for (const event of events) {
    for (const slot of event.carpool_slots ?? []) {
      const prev = map.get(slot.driver_uid);
      if (prev) {
        prev.trips += 1;
        if (!prev.last_trip_at || event.starts_at > prev.last_trip_at) {
          prev.last_trip_at = event.starts_at;
        }
      } else {
        map.set(slot.driver_uid, {
          uid: slot.driver_uid,
          name: slot.driver_name,
          trips: 1,
          last_trip_at: event.starts_at,
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => b.trips - a.trips || a.name.localeCompare(b.name));
}

export function totalCarpoolSeats(slots: CarpoolSlot[] | undefined): number {
  return (slots ?? []).reduce((acc, s) => acc + (s.seats ?? 0), 0);
}

export function isCarpoolDriver(event: TeamEvent, uid: string): boolean {
  return (event.carpool_slots ?? []).some((s) => s.driver_uid === uid);
}

export function carpoolSlotForDriver(
  event: TeamEvent,
  uid: string
): CarpoolSlot | undefined {
  return (event.carpool_slots ?? []).find((s) => s.driver_uid === uid);
}

export function newCarpoolMessageId(): string {
  return `cp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function newEventTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
