import type { TeamEvent } from '../models/TeamEvent';
import { getPendingInviteeUids, isLateRsvp } from '../models/TeamEvent';
import { scheduleProdayLocalNotification } from '../services/prodayLocalNotifications.service';
import { staffNotificationsService } from '../services/staffNotifications.service';
import { parentalGuardianService } from '../services/parentalGuardian.service';
import type { User } from '../models/User';

export interface PendingConvocationsSummary {
  totalPendingCount: number;
  eventsWithPending: Array<{
    event: TeamEvent;
    pendingUids: string[];
    pendingCount: number;
  }>;
}

/**
 * Analyse les événements à venir et calcule les convocations en attente de réponse.
 */
export function getPendingConvocationsSummary(events: TeamEvent[]): PendingConvocationsSummary {
  const now = Date.now();
  // Événements futurs ou du jour (dans les dernières 2 heures jusqu'à l'avenir)
  const upcomingEvents = events.filter(
    (e) => e.starts_at.getTime() >= now - 2 * 3600_000,
  );

  const eventsWithPending: PendingConvocationsSummary['eventsWithPending'] = [];
  let totalPendingCount = 0;

  for (const event of upcomingEvents) {
    const pendingUids = getPendingInviteeUids(event).filter((uid) => {
      const status = event.rsvps[uid] ?? 'pending';
      return status === 'pending' && !isLateRsvp(status);
    });

    if (pendingUids.length > 0) {
      eventsWithPending.push({
        event,
        pendingUids,
        pendingCount: pendingUids.length,
      });
      totalPendingCount += pendingUids.length;
    }
  }

  return {
    totalPendingCount,
    eventsWithPending,
  };
}

/**
 * Exécute la relance groupée en 1 clic pour une liste d'événements ou un événement unique.
 */
export async function executeBulkRsvpReminders(
  events: TeamEvent[],
  actor?: { user: User; isAdmin?: boolean } | null,
): Promise<{
  success: boolean;
  eventCount: number;
  remindedCount: number;
  recipientUids: string[];
}> {
  const summary = getPendingConvocationsSummary(events);
  if (summary.eventsWithPending.length === 0) {
    return {
      success: true,
      eventCount: 0,
      remindedCount: 0,
      recipientUids: [],
    };
  }

  const allRemindedUids: string[] = [];
  let eventCount = 0;

  for (const item of summary.eventsWithPending) {
    const { event, pendingUids } = item;
    eventCount += 1;

    for (const uid of pendingUids) {
      allRemindedUids.push(uid);
      try {
        // Notification locale vers le joueur
        await scheduleProdayLocalNotification({
          identifier: `convocation-reminder-${event.id}-${uid}`,
          title: 'Convocation en attente',
          body: `Rappel : Merci de confirmer votre présence à « ${event.title} ».`,
          data: {
            type: 'convocation_j1',
            eventId: event.id,
            homeTab: 'convocations',
            hubChapter: 'apercu',
          },
        });

        // Notification staff / club inbox
        if (event.club_id) {
          await staffNotificationsService.notifyRecipients({
            recipient_uids: [uid],
            type: 'generic',
            title: `Rappel convocation : ${event.title}`,
            body: `Votre coach attend votre confirmation pour « ${event.title} ».`,
            event_id: event.id,
            club_id: event.club_id,
            player_uid: uid,
          });
        }

        // Notification tuteur si joueur mineur
        const guardianEmail = await parentalGuardianService.getGuardianEmailForMinor(uid).catch(() => null);
        if (guardianEmail) {
          await scheduleProdayLocalNotification({
            identifier: `guardian-reminder-${event.id}-${uid}`,
            title: 'Convocation en attente (mineur)',
            body: `Merci de confirmer la présence de votre enfant à : ${event.title}`,
            data: {
              type: 'guardian_minor_invite',
              eventId: event.id,
              guardianEmail,
              homeTab: 'convocations',
            },
          });
        }
      } catch {
        // Best-effort par destinataire
      }
    }
  }

  return {
    success: true,
    eventCount,
    remindedCount: allRemindedUids.length,
    recipientUids: [...new Set(allRemindedUids)],
  };
}
