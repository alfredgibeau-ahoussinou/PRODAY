/**
 * Helpers Pôle Événements — listes, résultats, inscriptions (sans paiements).
 * TODO: Stripe / IAP pour registration_price_cents.
 */

import type {
  EventRegistration,
  EventRegistrationStatus,
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

/** Stub résultats — structure pour classements futurs. */
export type EventResultStub = {
  event_id: string;
  entries: { rank: number; label: string; score?: string }[];
  published: boolean;
};

export function emptyEventResults(eventId: string): EventResultStub {
  return { event_id: eventId, entries: [], published: false };
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
