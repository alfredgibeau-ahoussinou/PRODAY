import type { TeamEvent } from '../models/TeamEvent';
import { getPendingInviteeUids, isLateRsvp } from '../models/TeamEvent';
import { scheduleProdayLocalNotification } from '../services/prodayLocalNotifications.service';
import { staffNotificationsService } from '../services/staffNotifications.service';
import { parentalGuardianService } from '../services/parentalGuardian.service';
import type { User } from '../models/User';

/**
 * Trace d'historique **staff** d'une relance — un document dans l'inbox club,
 * invisible pour le joueur, requêtable par type (`rsvp_reminder_log`). C'est
 * l'historique demandé : qui a relancé, quand (horodatage du document), pour
 * quel joueur et quel événement, avec le résultat par canal.
 */
function logReminderToStaffInbox(input: {
  event: TeamEvent;
  uid: string;
  playerName: string | null;
  channels: { player: boolean; staff: boolean; guardian: boolean };
  actor?: { user: User; isAdmin?: boolean } | null;
}): void {
  if (!input.event.club_id) return;
  void staffNotificationsService
    .notifyRecipients({
      recipient_uids: [input.event.organizer_uid],
      type: 'rsvp_reminder_log',
      title: 'Journal des relances',
      body: `Relance de convocation envoyée à ${input.playerName ?? input.uid} pour « ${input.event.title} ».`,
      event_id: input.event.id,
      club_id: input.event.club_id,
      player_uid: input.uid,
      /** Journal : déjà lu à la création, ce n'est pas une alerte à traiter. */
      markAsRead: true,
      meta: {
        /** Qui : l'acteur de session, avec repli sur l'organisateur de l'événement. */
        reminded_by_uid: input.actor?.user.uid ?? input.event.organizer_uid,
        reminded_by_name: input.actor?.user.display_name ?? input.event.organizer_name ?? null,
        reminded_by_is_admin: input.actor?.isAdmin ?? false,
        channels: input.channels,
      },
    })
    .catch(() => undefined);
}

/**
 * Trace **agrégée** d'une relance groupée — une entrée par événement, avec le
 * nombre de destinataires et la liste des uids : c'est la ligne d'historique
 * « qui, quand, combien de destinataires ». Écrite une seule fois après la
 * boucle d'envoi, pour ne pas noyer l'inbox staff sous une entrée par joueur.
 */
function logBulkReminderToStaffInbox(input: {
  event: TeamEvent;
  uids: string[];
  actor?: { user: User; isAdmin?: boolean } | null;
}): void {
  if (!input.event.club_id || input.uids.length === 0) return;
  void staffNotificationsService
    .notifyRecipients({
      recipient_uids: [input.event.organizer_uid],
      type: 'rsvp_reminder_log',
      title: 'Journal des relances',
      body: `Relance groupée : ${input.uids.length} joueur${input.uids.length > 1 ? 's' : ''} notifié${input.uids.length > 1 ? 's' : ''} pour « ${input.event.title} ».`,
      event_id: input.event.id,
      club_id: input.event.club_id,
      /** Journal : déjà lu à la création, ce n'est pas une alerte à traiter. */
      markAsRead: true,
      meta: {
        mode: 'bulk',
        reminded_by_uid: input.actor?.user.uid ?? input.event.organizer_uid,
        reminded_by_name: input.actor?.user.display_name ?? input.event.organizer_name ?? null,
        reminded_by_is_admin: input.actor?.isAdmin ?? false,
        recipients_count: input.uids.length,
        recipient_uids: input.uids,
      },
    })
    .catch(() => undefined);
}

export interface PendingConvocationsSummary {
  totalPendingCount: number;
  eventsWithPending: Array<{
    event: TeamEvent;
    pendingUids: string[];
    pendingCount: number;
  }>;
}

/**
 * Résultat d'une relance — trois cas distingués, parce qu'ils ne se disent pas
 * parement à l'écran : `ok` (envoyée), `blocked` (refusée par le garde-fou
 * 24 h, avec l'horodatage de la dernière relance) et l'échec d'envoi.
 */
export type RsvpReminderOutcome =
  | { ok: true; blocked: false }
  | { ok: false; blocked: true; lastRemindedAt: number }
  | { ok: false; blocked: false };

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
 * Relance **un** joueur sur une convocation — même contenu que la relance
 * groupée : notification locale, inbox staff/club, et tuteur si le joueur est
 * mineur. Extraite de la boucle groupée pour que la relance individuelle du
 * détail par joueur ne puisse pas diverger de la relance en masse.
 *
 * Best-effort par canal : une notification qui échoue n'empêche pas les autres.
 * Par défaut, chaque relance aboutie est **journalisée** dans l'inbox staff du
 * club (`rsvp_reminder_log`) ; la relance groupée désactive ce journal unitaire
 * et écrit une trace agrégée par événement.
 *
 * **Anti-spam** : une deuxième relance du même joueur sur le même événement est
 * refusée moins de 24 h après la précédente — décision lue dans l'historique
 * journalisé, jamais dans un état local. Le résultat distingue l'échec
 * d'envoi (`blocked: false`) du refus de garde-fou (`blocked: true`).
 */
/** Délai minimal entre deux relances du même joueur sur le même événement. */
export const RSVP_REMINDER_COOLDOWN_MS = 24 * 3600_000;

/**
 * Relances **récentes** de cet événement — lecture de l'historique journalisé
 * (`rsvp_reminder_log`). Règle d'appartenance : un joueur est couvert par une
 * trace individuelle le concernant, ou par une trace groupée qui listait son
 * uid. En cas d'échec de lecture, le garde-fou est **levé** : on préfère une
 * relance redondante à une convocation jamais relancée.
 */
async function recentlyRemindedUids(eventId: string): Promise<Map<string, number>> {
  /** Lecture best-effort : en cas d'échec, liste vide → garde-fou levé. */
  const logs = await Promise.resolve()
    .then(() => staffNotificationsService.listReminderLogsForEvent(eventId))
    .catch(() => []);
  const now = Date.now();
  const recent = new Map<string, number>();
  for (const log of logs) {
    const age = now - log.created_at.getTime();
    if (age >= RSVP_REMINDER_COOLDOWN_MS) continue;
    const meta = (log.meta ?? {}) as {
      recipient_uids?: unknown;
      player_uid?: unknown;
    };
    /** Trace groupée : la liste des destinataires journalisée. */
    if (Array.isArray(meta.recipient_uids)) {
      for (const uid of meta.recipient_uids) {
        if (typeof uid === 'string') recent.set(uid, log.created_at.getTime());
      }
      continue;
    }
    /** Trace individuelle : le champ player_uid du document. */
    if (typeof meta.player_uid === 'string') {
      recent.set(meta.player_uid, log.created_at.getTime());
    }
  }
  return recent;
}

export async function executeRsvpReminderForPlayer(
  event: TeamEvent,
  uid: string,
  options?: {
    /** Auteur de la relance — l'acteur staff, pour la trace d'historique. */
    actor?: { user: User; isAdmin?: boolean } | null;
    /** Nom du joueur, si l'appelant l'a déjà lu (feuille nominative). */
    playerName?: string | null;
    /** `false` pendant une relance groupée : la trace agrégée est écrite par la boucle. */
    log?: boolean;
    /** `false` pour ignorer le garde-fou 24 h (boucle groupée, qui pré-filtre). */
    checkCooldown?: boolean;
  },
): Promise<RsvpReminderOutcome> {
  const playerName = options?.playerName ?? null;
  const channels = { player: false, staff: false, guardian: false };

  /**
   * Garde-fou anti-spam — lu dans l'historique, avant tout envoi. La boucle
   * groupée passe `checkCooldown: false` : elle a déjà filtré ses destinataires
   * en une seule lecture pour tout le monde.
   */
  if (options?.checkCooldown !== false) {
    const recent = await recentlyRemindedUids(event.id);
    const lastAt = recent.get(uid);
    if (lastAt !== undefined) {
      return { ok: false, blocked: true, lastRemindedAt: lastAt };
    }
  }

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
    channels.player = true;

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
      channels.staff = true;
    }

    // Notification tuteur si joueur mineur
    const guardianEmail = await parentalGuardianService
      .getGuardianEmailForMinor(uid)
      .catch(() => null);
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
      channels.guardian = true;
    }

    /**
     * Trace d'historique — journalisée seulement si un canal a réellement émis.
     * La relance **groupée** passe `log: false` : elle écrit elle-même une trace
     * unique « combien de destinataires » par événement.
     */
    if (options?.log !== false && (channels.player || channels.staff || channels.guardian)) {
      logReminderToStaffInbox({ event, uid, playerName, channels, actor: options?.actor ?? null });
    }
    return { ok: true, blocked: false };
  } catch {
    // Best-effort : l'appelant décide du message (silence en masse, libellé en détail).
    return { ok: false, blocked: false };
  }
}
export async function executeBulkRsvpReminders(
  events: TeamEvent[],
  actor?: { user: User; isAdmin?: boolean } | null,
): Promise<{
  success: boolean;
  eventCount: number;
  remindedCount: number;
  recipientUids: string[];
  /** Invités toujours sans réponse **et** déjà relancés < 24 h : non renvoyés. */
  blockedCount: number;
}> {
  const summary = getPendingConvocationsSummary(events);
  if (summary.eventsWithPending.length === 0) {
    return {
      success: true,
      eventCount: 0,
      remindedCount: 0,
      recipientUids: [],
      blockedCount: 0,
    };
  }

  const allRemindedUids: string[] = [];
  let eventCount = 0;
  let blockedCount = 0;

  for (const item of summary.eventsWithPending) {
    const { event, pendingUids } = item;
    eventCount += 1;

    /**
     * Garde-fou 24 h — **une seule lecture d'historique par événement**, puis
     * filtrage des destinataires. Chaque envoi passe `checkCooldown: false` :
     * la décision a déjà été prise ici, en lisant le journal.
     */
    const recent = await recentlyRemindedUids(event.id);
    const sendable = pendingUids.filter((uid) => !recent.has(uid));
    blockedCount += pendingUids.length - sendable.length;
    if (sendable.length === 0) continue;

    for (const uid of sendable) {
      allRemindedUids.push(uid);
      // Même relance que le détail par joueur — un seul chemin d'envoi.
      // `log: false` : la trace agrégée de l'événement est écrite ci-dessous.
      await executeRsvpReminderForPlayer(event, uid, {
        actor,
        log: false,
        checkCooldown: false,
      });
    }

    /** Une seule entrée d'historique par événement : qui, quand, combien. */
    logBulkReminderToStaffInbox({ event, uids: sendable, actor });
  }

  return {
    success: true,
    eventCount,
    remindedCount: allRemindedUids.length,
    recipientUids: [...new Set(allRemindedUids)],
    blockedCount,
  };
}
