/**
 * Helpers Pôle Événements — listes, résultats, inscriptions, partage.
 */

import type {
  EventRegistration,
  EventRegistrationStatus,
  EventResults,
  EventResultEntry,
  OrganizerEvent,
  EventOrganizerStatus,
} from '../models/EventOrganizer';

export function canOpenRegistration(status: EventOrganizerStatus): boolean {
  return status === 'published' || status === 'registration_open';
}

export function registrationIsActive(status: EventRegistrationStatus): boolean {
  return status === 'pending' || status === 'confirmed' || status === 'waitlist' || status === 'paid';
}

/** Capacité restante (null = illimité). */
export function remainingCapacity(
  event: Pick<OrganizerEvent, 'capacity'>,
  activeRegistrations: number,
): number | null {
  if (event.capacity == null) return null;
  return Math.max(0, event.capacity - activeRegistrations);
}

export function assignRegistrationStatus(
  event: Pick<OrganizerEvent, 'capacity' | 'status'>,
  activeCount: number,
): EventRegistrationStatus {
  if (!canOpenRegistration(event.status) && event.status !== 'registration_open') {
    return 'cancelled';
  }
  const remaining = remainingCapacity(event, activeCount);
  if (remaining === 0) return 'waitlist';
  return 'confirmed';
}

/** @deprecated Prefer EventResults — kept for tests / migration. */
export type EventResultStub = EventResults;

export function emptyEventResults(eventId: string): EventResults {
  return { event_id: eventId, entries: [], published: false };
}

export function publishEventResults(
  eventId: string,
  entries: EventResultEntry[],
): EventResults {
  return {
    event_id: eventId,
    entries: [...entries].sort((a, b) => a.rank - b.rank),
    published: true,
    published_at: new Date(),
  };
}

export function sortRegistrationsByStatus(regs: EventRegistration[]): EventRegistration[] {
  const order: EventRegistrationStatus[] = [
    'confirmed',
    'paid',
    'pending',
    'waitlist',
    'cancelled',
  ];
  return [...regs].sort(
    (a, b) => order.indexOf(a.status) - order.indexOf(b.status),
  );
}

export function eventRequiresPayment(
  event: Pick<OrganizerEvent, 'registration_price_cents'>,
): boolean {
  return (event.registration_price_cents ?? 0) > 0;
}

export function countActiveRegistrations(regs: EventRegistration[]): number {
  return regs.filter((r) => registrationIsActive(r.status)).length;
}
