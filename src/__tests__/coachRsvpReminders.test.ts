jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
  addDoc: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({ getDb: jest.fn(() => null) }));
jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => false),
}));
jest.mock('../services/prodayLocalNotifications.service', () => ({
  scheduleProdayLocalNotification: jest.fn().mockResolvedValue('notif-1'),
}));
jest.mock('../services/staffNotifications.service', () => ({
  staffNotificationsService: {
    notifyRecipients: jest.fn().mockResolvedValue({ delivered: 1 }),
  },
}));
jest.mock('../services/parentalGuardian.service', () => ({
  parentalGuardianService: {
    getGuardianEmailForMinor: jest.fn().mockResolvedValue(null),
    sendGuardianNotification: jest.fn().mockResolvedValue(true),
  },
}));

import type { TeamEvent } from '../models/TeamEvent';
import {
  getPendingConvocationsSummary,
  executeBulkRsvpReminders,
} from '../utils/coachRsvpReminders';

function makeEvent(
  id: string,
  startsInHours: number,
  rsvps: Record<string, 'yes' | 'no' | 'pending' | 'late_under_10'>,
): TeamEvent {
  return {
    id,
    title: `Séance ${id}`,
    event_type: 'training',
    organizer_uid: 'coach-1',
    organizer_name: 'Coach Test',
    starts_at: new Date(Date.now() + startsInHours * 3600_000),
    city: 'Paris',
    invitee_uids: Object.keys(rsvps),
    rsvps,
    rsvp_notes: {},
    attendance_marks: {},
    reminder_hours_before: 24,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

describe('coachRsvpReminders', () => {
  it('calcule correctement les convocations en attente de réponse', () => {
    const events: TeamEvent[] = [
      makeEvent('ev-1', 24, {
        'player-1': 'yes',
        'player-2': 'pending',
        'player-3': 'pending',
      }),
      makeEvent('ev-2', 48, {
        'player-1': 'pending',
        'player-4': 'no',
      }),
      // Événement passé (il y a 5h) — ne doit pas être comptabilisé
      makeEvent('ev-3', -5, {
        'player-2': 'pending',
      }),
    ];

    const summary = getPendingConvocationsSummary(events);
    expect(summary.totalPendingCount).toBe(3); // 2 dans ev-1 + 1 dans ev-2
    expect(summary.eventsWithPending).toHaveLength(2);
    expect(summary.eventsWithPending[0]?.event.id).toBe('ev-1');
    expect(summary.eventsWithPending[0]?.pendingCount).toBe(2);
    expect(summary.eventsWithPending[1]?.event.id).toBe('ev-2');
    expect(summary.eventsWithPending[1]?.pendingCount).toBe(1);
  });

  it('exécute les relances groupées en 1 clic pour tous les joueurs en attente', async () => {
    const events: TeamEvent[] = [
      makeEvent('ev-1', 12, {
        'player-1': 'pending',
        'player-2': 'pending',
      }),
      makeEvent('ev-2', 36, {
        'player-3': 'pending',
      }),
    ];

    const result = await executeBulkRsvpReminders(events, {
      user: { uid: 'coach-1', display_name: 'Coach Pro', email: 'c@test.com', role: 'coach' } as any,
    });

    expect(result.success).toBe(true);
    expect(result.eventCount).toBe(2);
    expect(result.remindedCount).toBe(3);
    expect(result.recipientUids).toContain('player-1');
    expect(result.recipientUids).toContain('player-2');
    expect(result.recipientUids).toContain('player-3');
  });

  it('gère le cas où aucune convocation n’est en attente', async () => {
    const events: TeamEvent[] = [
      makeEvent('ev-1', 12, {
        'player-1': 'yes',
        'player-2': 'no',
      }),
    ];

    const summary = getPendingConvocationsSummary(events);
    expect(summary.totalPendingCount).toBe(0);
    expect(summary.eventsWithPending).toHaveLength(0);

    const result = await executeBulkRsvpReminders(events);
    expect(result.success).toBe(true);
    expect(result.remindedCount).toBe(0);
    expect(result.eventCount).toBe(0);
  });
});
