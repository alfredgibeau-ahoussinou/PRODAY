import {
  assignRegistrationStatus,
  countActiveRegistrations,
  emptyEventResults,
  eventRequiresPayment,
  publishEventResults,
  remainingCapacity,
  sortRegistrationsByStatus,
} from '../utils/eventOrganizerScaffold';
import {
  buildEventResultsShareMessage,
  buildOrganizerEventShareMessage,
} from '../utils/eventOrganizerShare';
import type { EventRegistration, OrganizerEvent } from '../models/EventOrganizer';

describe('eventOrganizerScaffold', () => {
  it('calcule capacité et waitlist', () => {
    expect(remainingCapacity({ capacity: 10 }, 3)).toBe(7);
    expect(remainingCapacity({ capacity: null }, 99)).toBeNull();
    expect(assignRegistrationStatus({ capacity: 2, status: 'registration_open' }, 2)).toBe(
      'waitlist',
    );
    expect(assignRegistrationStatus({ capacity: 5, status: 'registration_open' }, 1)).toBe(
      'confirmed',
    );
  });

  it('trie les inscriptions et stub résultats', () => {
    const regs = [
      { id: '1', status: 'waitlist' },
      { id: '2', status: 'confirmed' },
      { id: '3', status: 'pending' },
    ] as EventRegistration[];
    expect(sortRegistrationsByStatus(regs).map((r) => r.id)).toEqual(['2', '3', '1']);
    expect(emptyEventResults('e1').entries).toEqual([]);
    expect(countActiveRegistrations(regs)).toBe(3);
  });

  it('détecte paiement requis et publie résultats', () => {
    expect(eventRequiresPayment({ registration_price_cents: 1500 })).toBe(true);
    expect(eventRequiresPayment({ registration_price_cents: 0 })).toBe(false);
    const published = publishEventResults('e1', [
      { rank: 2, label: 'B' },
      { rank: 1, label: 'A', score: '3-1' },
    ]);
    expect(published.published).toBe(true);
    expect(published.entries.map((e) => e.label)).toEqual(['A', 'B']);
  });
});

describe('eventOrganizerShare', () => {
  const event: OrganizerEvent = {
    id: 'e1',
    organizer_uid: 'u1',
    kind: 'tournament',
    title: 'Open Foot',
    city: 'Paris',
    venue: 'Stade A',
    starts_at: new Date('2026-09-01T10:00:00Z'),
    status: 'registration_open',
    capacity: 40,
    registration_price_cents: 1000,
    media_urls: ['https://example.com/photo.jpg'],
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('construit message partage événement', () => {
    const msg = buildOrganizerEventShareMessage(event);
    expect(msg).toContain('Open Foot');
    expect(msg).toContain('10.00 €');
    expect(msg).toContain('https://example.com/photo.jpg');
  });

  it('construit message résultats', () => {
    const msg = buildEventResultsShareMessage(event, {
      event_id: 'e1',
      entries: [{ rank: 1, label: 'Équipe A', score: '2-0' }],
      published: true,
    });
    expect(msg).toContain('Équipe A');
    expect(msg).toContain('2-0');
  });
});
