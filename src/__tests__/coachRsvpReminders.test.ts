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
    listReminderLogsForEvent: jest.fn().mockResolvedValue([]),
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
  executeRsvpReminderForPlayer,
} from '../utils/coachRsvpReminders';
import { scheduleProdayLocalNotification } from '../services/prodayLocalNotifications.service';
import { staffNotificationsService } from '../services/staffNotifications.service';
import { parentalGuardianService } from '../services/parentalGuardian.service';

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

describe('executeRsvpReminderForPlayer — relance individuelle', () => {
  /** La fabrique du fichier ne pose pas club_id : l'inbox staff en a besoin. */
  const event = { ...makeEvent('ev-1', 12, { 'player-1': 'pending' }), club_id: 'club1' } as TeamEvent;

  beforeEach(() => {
    (scheduleProdayLocalNotification as jest.Mock).mockClear();
    (staffNotificationsService.notifyRecipients as jest.Mock).mockClear();
  });

  it('envoie les mêmes canaux que la relance groupée : joueur + inbox staff', async () => {
    const ok = await executeRsvpReminderForPlayer(event, 'player-1');

    expect(ok).toEqual(expect.objectContaining({ ok: true }));
    expect(scheduleProdayLocalNotification).toHaveBeenCalledTimes(1);
    expect(scheduleProdayLocalNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'convocation-reminder-ev-1-player-1',
        title: 'Convocation en attente',
      }),
    );
    expect(staffNotificationsService.notifyRecipients).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_uids: ['player-1'],
        event_id: 'ev-1',
        player_uid: 'player-1',
      }),
    );
    /** Pas de tuteur résolu → pas de notification tuteur. */
    expect(scheduleProdayLocalNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({ identifier: expect.stringContaining('guardian') }),
    );
  });

  it('prévient le tuteur quand le joueur est mineur', async () => {
    (parentalGuardianService.getGuardianEmailForMinor as jest.Mock).mockResolvedValueOnce(
      'parent@test.com',
    );

    const ok = await executeRsvpReminderForPlayer(event, 'player-2');

    expect(ok).toEqual(expect.objectContaining({ ok: true }));
    expect(scheduleProdayLocalNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'guardian-reminder-ev-1-player-2',
        title: 'Convocation en attente (mineur)',
      }),
    );
  });

  it('échoue sans lever : la feuille peut afficher « Échec » au lieu de planter', async () => {
    (scheduleProdayLocalNotification as jest.Mock).mockRejectedValueOnce(
      new Error('permission refusée'),
    );

    await expect(executeRsvpReminderForPlayer(event, 'player-3')).resolves.toEqual(
      expect.objectContaining({ ok: false }),
    );
  });

  it('saute l\'inbox staff quand l\'événement n\'est rattaché à aucun club', async () => {
    (staffNotificationsService.notifyRecipients as jest.Mock).mockClear();
    const orphanEvent = makeEvent('ev-orphan', 12, { 'player-8': 'pending' });
    expect(orphanEvent.club_id).toBeUndefined();

    const ok = await executeRsvpReminderForPlayer(orphanEvent, 'player-8');

    /** La relance joueur part quand même. */
    expect(ok).toEqual(expect.objectContaining({ ok: true }));
    expect(scheduleProdayLocalNotification).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'convocation-reminder-ev-orphan-player-8' }),
    );
    expect(staffNotificationsService.notifyRecipients).not.toHaveBeenCalled();
  });

  it('la relance groupée passe par le même chemin que la relance individuelle', async () => {
    (scheduleProdayLocalNotification as jest.Mock).mockClear();
    (staffNotificationsService.notifyRecipients as jest.Mock).mockClear();

    const events: TeamEvent[] = [
      { ...makeEvent('ev-9', 12, { 'player-7': 'pending' }), club_id: 'club1' } as TeamEvent,
    ];
    await executeBulkRsvpReminders(events);

    expect(scheduleProdayLocalNotification).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'convocation-reminder-ev-9-player-7' }),
    );
    expect(staffNotificationsService.notifyRecipients).toHaveBeenCalledWith(
      expect.objectContaining({ recipient_uids: ['player-7'] }),
    );
  });

  it('journalise la relance individuelle dans l\'inbox staff (qui, quand, pour qui, canaux)', async () => {
    (staffNotificationsService.notifyRecipients as jest.Mock).mockClear();

    await executeRsvpReminderForPlayer(event, 'player-1', {
      actor: { user: { uid: 'coach-1', display_name: 'Coach Pro' } as any },
      playerName: 'Mamadou D.',
    });

    const logCall = (staffNotificationsService.notifyRecipients as jest.Mock).mock.calls.find(
      (call) => call[0]?.type === 'rsvp_reminder_log',
    );
    expect(logCall).toBeDefined();
    expect(logCall[0]).toEqual(
      expect.objectContaining({
        recipient_uids: ['coach-1'],
        event_id: 'ev-1',
        club_id: 'club1',
        player_uid: 'player-1',
        meta: expect.objectContaining({
          reminded_by_uid: 'coach-1',
          reminded_by_name: 'Coach Pro',
          channels: expect.objectContaining({ player: true }),
        }),
      }),
    );
    expect(logCall[0].body).toContain('Mamadou D.');
  });

  it('une relance qui échoue partout ne journalise rien', async () => {
    (scheduleProdayLocalNotification as jest.Mock).mockRejectedValueOnce(
      new Error('permission refusée'),
    );
    (staffNotificationsService.notifyRecipients as jest.Mock).mockClear();

    await executeRsvpReminderForPlayer(event, 'player-4');

    expect(
      (staffNotificationsService.notifyRecipients as jest.Mock).mock.calls.some(
        (call) => call[0]?.type === 'rsvp_reminder_log',
      ),
    ).toBe(false);
  });
});

describe('Journal des relances groupées — une trace par événement', () => {
  const bulkEvent = { ...makeEvent('ev-bulk', 12, { 'p-1': 'pending', 'p-2': 'pending', 'p-3': 'pending' }), club_id: 'club1' } as TeamEvent;

  beforeEach(() => {
    (scheduleProdayLocalNotification as jest.Mock).mockClear();
    (staffNotificationsService.notifyRecipients as jest.Mock).mockClear();
  });

  it('écrit UNE trace agrégée : qui, quand, combien de destinataires', async () => {
    await executeBulkRsvpReminders([bulkEvent], {
      user: { uid: 'coach-9', display_name: 'Coach Alpha' } as any,
    });

    const logCalls = (staffNotificationsService.notifyRecipients as jest.Mock).mock.calls.filter(
      (call) => call[0]?.type === 'rsvp_reminder_log',
    );
    expect(logCalls).toHaveLength(1);
    expect(logCalls[0][0]).toEqual(
      expect.objectContaining({
        recipient_uids: ['coach-1'],
        event_id: 'ev-bulk',
        club_id: 'club1',
        meta: expect.objectContaining({
          mode: 'bulk',
          reminded_by_uid: 'coach-9',
          reminded_by_name: 'Coach Alpha',
          recipients_count: 3,
          recipient_uids: ['p-1', 'p-2', 'p-3'],
        }),
      }),
    );
    expect(logCalls[0][0].body).toContain('3 joueurs');
  });

  it('la boucle groupée ne duplique pas le journal unitaire', async () => {
    await executeBulkRsvpReminders([bulkEvent]);

    const logCalls = (staffNotificationsService.notifyRecipients as jest.Mock).mock.calls.filter(
      (call) => call[0]?.type === 'rsvp_reminder_log',
    );
    expect(logCalls).toHaveLength(1);
    /** Chaque joueur a bien été relancé individuellement, sans trace unitaire. */
    expect(scheduleProdayLocalNotification).toHaveBeenCalledTimes(3);
  });

  it('sans club rattaché, aucune trace n\'est écrite', async () => {
    const orphan = makeEvent('ev-orphan-bulk', 12, { 'p-9': 'pending' });
    await executeBulkRsvpReminders([orphan]);

    expect(
      (staffNotificationsService.notifyRecipients as jest.Mock).mock.calls.some(
        (call) => call[0]?.type === 'rsvp_reminder_log',
      ),
    ).toBe(false);
  });
});

describe('Garde-fou 24 h — lu dans l\'historique journalisé', () => {
  const guardEvent = {
    ...makeEvent('ev-guard', 12, { 'g-1': 'pending', 'g-2': 'pending' }),
    club_id: 'club1',
  } as TeamEvent;

  beforeEach(() => {
    (scheduleProdayLocalNotification as jest.Mock).mockClear();
    (staffNotificationsService.notifyRecipients as jest.Mock).mockClear();
    (staffNotificationsService.listReminderLogsForEvent as jest.Mock).mockClear();
    (staffNotificationsService.listReminderLogsForEvent as jest.Mock).mockResolvedValue([]);
  });

  it('refuse la 2e relance < 24 h : blocked, rien n\'est envoyé', async () => {
    const lastAt = Date.now() - 3 * 3600_000;
    (staffNotificationsService.listReminderLogsForEvent as jest.Mock).mockResolvedValueOnce([
      {
        id: 'log-1',
        type: 'rsvp_reminder_log',
        created_at: new Date(lastAt),
        meta: { player_uid: 'g-1' },
      },
    ]);

    const outcome = await executeRsvpReminderForPlayer(guardEvent, 'g-1');

    expect(outcome).toEqual({ ok: false, blocked: true, lastRemindedAt: lastAt });
    expect(scheduleProdayLocalNotification).not.toHaveBeenCalled();
    expect(staffNotificationsService.notifyRecipients).not.toHaveBeenCalled();
  });

  it('accepte une relance au-delà de 24 h, et tolère une liste mixte', async () => {
    (staffNotificationsService.listReminderLogsForEvent as jest.Mock).mockResolvedValueOnce([
      {
        id: 'log-2',
        type: 'rsvp_reminder_log',
        created_at: new Date(Date.now() - 25 * 3600_000),
        meta: { player_uid: 'g-1' },
      },
    ]);

    const outcome = await executeRsvpReminderForPlayer(guardEvent, 'g-1');

    expect(outcome).toEqual({ ok: true, blocked: false });
    expect(scheduleProdayLocalNotification).toHaveBeenCalled();
  });

  it('une trace groupée couvre tous les uids journalisés', async () => {
    (staffNotificationsService.listReminderLogsForEvent as jest.Mock).mockResolvedValueOnce([
      {
        id: 'log-3',
        type: 'rsvp_reminder_log',
        created_at: new Date(Date.now() - 2 * 3600_000),
        meta: { mode: 'bulk', recipient_uids: ['g-1', 'g-2'] },
      },
    ]);

    const outcome = await executeRsvpReminderForPlayer(guardEvent, 'g-2');

    expect(outcome).toEqual(
      expect.objectContaining({ ok: false, blocked: true, lastRemindedAt: expect.any(Number) }),
    );
    expect(scheduleProdayLocalNotification).not.toHaveBeenCalled();
  });

  it('échec de lecture de l\'historique → garde-fou levé, la relance part', async () => {
    (staffNotificationsService.listReminderLogsForEvent as jest.Mock).mockRejectedValueOnce(
      new Error('index manquant'),
    );

    const outcome = await executeRsvpReminderForPlayer(guardEvent, 'g-1');

    expect(outcome).toEqual({ ok: true, blocked: false });
    expect(scheduleProdayLocalNotification).toHaveBeenCalled();
  });

  it('la boucle groupée pré-filtre : blockedCount remonte, les autres partent', async () => {
    (staffNotificationsService.listReminderLogsForEvent as jest.Mock).mockResolvedValueOnce([
      {
        id: 'log-4',
        type: 'rsvp_reminder_log',
        created_at: new Date(Date.now() - 1 * 3600_000),
        meta: { player_uid: 'g-1' },
      },
    ]);

    const result = await executeBulkRsvpReminders([guardEvent]);

    expect(result.blockedCount).toBe(1);
    expect(result.remindedCount).toBe(1);
    expect(result.recipientUids).toEqual(['g-2']);
    /** g-1 n'a reçu aucune notification. */
    expect(scheduleProdayLocalNotification).toHaveBeenCalledTimes(1);
    expect(scheduleProdayLocalNotification).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'convocation-reminder-ev-guard-g-2' }),
    );
  });
});
