import {
  assignRegistrationStatus,
  emptyEventResults,
  remainingCapacity,
  sortRegistrationsByStatus,
} from '../utils/eventOrganizerScaffold';
import type { EventRegistration } from '../models/EventOrganizer';

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
  });
});
