import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { teamEventFromFirestore } from '../lib/firestoreMappers';
import type {
  TeamEvent,
  CreateTeamEventInput,
  RsvpStatus,
  AttendanceMark,
  PlayerMatchSheetStat,
  TeamEventType,
  EventLineup,
  LiveMatchAction,
  LiveActionType,
} from '../models/TeamEvent';
import { isLateRsvp, EVENT_TYPE_LABELS, isCoachMatchEvent, isCoachTrainingEvent } from '../models/TeamEvent';
import type { CarpoolSlot, EventTask, CarpoolMessage, MatchLiveState } from '../models/TeamEvent';
import type { GeoPoint } from '../models/User';
import {
  carpoolAvailableSeats,
  findCarpoolBooking,
  isCarpoolPassenger,
  newCarpoolMessageId,
  newEventTaskId,
} from '../utils/carpoolBalance';
import {
  buildTripParticipantUids,
  eventTripId,
  nextTripStatusOnEnd,
  nextTripStatusOnStart,
  slotTripStatus,
} from '../utils/carpoolLiveTrip';
import { carpoolLiveTripService } from './carpoolLiveTrip.service';
import { callFunction } from '../lib/firebaseFunctions';
import { usersService } from './users.service';
import { profileService } from './profile.service';
import { assertTeamEventManageAccess, assertTeamEventRsvpAccess } from '../utils/teamEventAccess';
import { buildActivityFromTeamEvent } from '../utils/teamEventActivitySync';
import {
  aggregateSeasonStats,
  collectMatchSheetPlayerUids,
  importLiveActionsToMatchSheet,
  seasonDeltaFromMatchSheet,
  tallyLiveActionStats,
} from '../utils/matchSeasonStats';
import { playerActivityService } from './playerActivity.service';
import type { User } from '../models/User';
import { parentalGuardianService } from './parentalGuardian.service';
import { scheduleProdayLocalNotification } from './prodayLocalNotifications.service';
import { staffNotificationsService } from './staffNotifications.service';

export type TeamEventActor = {
  user: User;
  isAdmin?: boolean;
};

function assertManage(
  event: TeamEvent,
  actor: TeamEventActor,
  options?: { allowWhenReportLocked?: boolean },
): void {
  assertTeamEventManageAccess(event, actor.user, {
    isAdmin: actor.isAdmin,
    allowWhenReportLocked: options?.allowWhenReportLocked,
  });
}

const COL = 'team_events';

function buildInitialRsvps(inviteeUids: string[]): Record<string, RsvpStatus> {
  const rsvps: Record<string, RsvpStatus> = {};
  for (const uid of inviteeUids) rsvps[uid] = 'pending';
  return rsvps;
}

async function syncPlayerActivityFromEvent(event: TeamEvent, playerUid: string): Promise<void> {
  const input = buildActivityFromTeamEvent(event, playerUid);
  if (!input) return;
  try {
    await playerActivityService.upsertFromTeamEvent(input);
  } catch (error) {
    console.warn('[teamEvents] syncPlayerActivityFromEvent:', error);
  }
}

async function syncTeamEventActivitiesOnServer(eventId: string): Promise<void> {
  try {
    await callFunction<{ eventId: string }, { synced: number; skipped: number }>(
      'syncTeamEventActivities',
      { eventId },
      'europe-west1'
    );
  } catch {
    /* trigger ou callable non déployé */
  }
}

async function notifyGuardiansForMinorInvitees(
  database: Firestore,
  eventId: string,
  inviteeUids: string[],
  title: string,
  startsAt?: Date,
  city?: string,
): Promise<void> {
  for (const inviteeUid of inviteeUids) {
    try {
      const guardianEmail = await parentalGuardianService.getGuardianEmailForMinor(inviteeUid);
      if (!guardianEmail) continue;
      await addDoc(collection(database, 'guardian_notifications'), {
        guardian_email: guardianEmail,
        child_uid: inviteeUid,
        event_id: eventId,
        event_title: title,
        event_city: city ?? null,
        event_starts_at: startsAt ? Timestamp.fromDate(startsAt) : null,
        type: 'minor_invite',
        source: 'team_events',
        read_at: null,
        created_at: serverTimestamp(),
      });
      await scheduleProdayLocalNotification({
        identifier: `guardian-invite-${eventId}-${inviteeUid}`,
        title: 'Invitation mineur',
        body: `Un mineur rattaché (${guardianEmail}) est invité à : ${title}`,
        data: {
          type: 'guardian_minor_invite',
          eventId,
          guardianEmail,
          homeTab: 'convocations',
          hubChapter: 'apercu',
        },
      });
    } catch {
      // Hook optionnel : ne bloque jamais la création d'événement.
    }
  }
}

export const teamEventsService = {
  async listUpcoming(max = 40): Promise<TeamEvent[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, COL),
        orderBy('starts_at', 'asc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => teamEventFromFirestore(d.id, d.data() as Record<string, unknown>))
        .filter((e) => e.starts_at.getTime() >= Date.now() - 86400000);
    } catch {
      const snap = await getDocs(collection(database, COL));
      return snap.docs
        .map((d) => teamEventFromFirestore(d.id, d.data() as Record<string, unknown>))
        .filter((e) => e.starts_at.getTime() >= Date.now() - 86400000)
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
    }
  },

  async listDetections(max = 20): Promise<TeamEvent[]> {
    const all = await this.listUpcoming(max * 2);
    return all
      .filter((e) => e.event_type === 'detection')
      .slice(0, max);
  },

  async listForUser(uid: string, clubId?: string): Promise<TeamEvent[]> {
    const all = await this.listUpcoming(60);
    return all.filter(
      (e) =>
        e.organizer_uid === uid ||
        e.invitee_uids.includes(uid) ||
        (clubId && e.club_id === clubId)
    );
  },

  /** Historique participation joueur (passé récent) — sync activités carrière. */
  async listParticipationHistory(uid: string, max = 80): Promise<TeamEvent[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    const cutoff = Date.now() - 90 * 86400000;
    try {
      const q = query(collection(database, COL), orderBy('starts_at', 'desc'), limit(max * 2));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => teamEventFromFirestore(d.id, d.data() as Record<string, unknown>))
        .filter(
          (e) =>
            (e.organizer_uid === uid || e.invitee_uids.includes(uid)) &&
            e.starts_at.getTime() >= cutoff
        )
        .slice(0, max);
    } catch {
      const snap = await getDocs(collection(database, COL));
      return snap.docs
        .map((d) => teamEventFromFirestore(d.id, d.data() as Record<string, unknown>))
        .filter(
          (e) =>
            (e.organizer_uid === uid || e.invitee_uids.includes(uid)) &&
            e.starts_at.getTime() >= cutoff
        )
        .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())
        .slice(0, max);
    }
  },

  /** Événements club (passés + à venir) — recherche ciblée par club_id et team_id */
  async listForClub(clubId: string, max = 120, teamIds?: string[]): Promise<TeamEvent[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const map = new Map<string, TeamEvent>();

      // 1. Requête ciblée directe par club_id
      try {
        const qClub = query(
          collection(database, COL),
          where('club_id', '==', clubId),
          limit(max)
        );
        const snapClub = await getDocs(qClub);
        snapClub.docs.forEach((d) => {
          const ev = teamEventFromFirestore(d.id, d.data() as Record<string, unknown>);
          map.set(ev.id, ev);
        });
      } catch (err) {
        console.warn('[teamEvents.service] listForClub query club_id error:', err);
      }

      // 2. Requête ciblée pour les équipes affiliées au club
      if (teamIds && teamIds.length > 0) {
        for (let i = 0; i < teamIds.length; i += 10) {
          const chunk = teamIds.slice(i, i + 10);
          try {
            const qTeam = query(
              collection(database, COL),
              where('team_id', 'in', chunk),
              limit(max)
            );
            const snapTeam = await getDocs(qTeam);
            snapTeam.docs.forEach((d) => {
              const ev = teamEventFromFirestore(d.id, d.data() as Record<string, unknown>);
              map.set(ev.id, ev);
            });
          } catch (err) {
            console.warn('[teamEvents.service] listForClub query team_id error:', err);
          }
        }
      }

      // Si des événements ont été trouvés par requêtes ciblées
      if (map.size > 0) {
        return Array.from(map.values()).sort(
          (a, b) => b.starts_at.getTime() - a.starts_at.getTime()
        );
      }
    } catch {
      // Fallback global ci-dessous
    }

    // 3. Fallback si les requêtes Firestore indexées échouent ou ne renvoient rien
    try {
      const snap = await getDocs(collection(database, COL));
      const teamSet = new Set(teamIds ?? []);
      return snap.docs
        .map((d) => teamEventFromFirestore(d.id, d.data() as Record<string, unknown>))
        .filter((e) => e.club_id === clubId || (e.team_id != null && teamSet.has(e.team_id)))
        .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())
        .slice(0, max);
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<TeamEvent | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, COL, id));
    if (!snap.exists()) return null;
    return teamEventFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async create(input: CreateTeamEventInput): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    let targetClubId = input.club_id && input.club_id !== 'club_default' ? input.club_id : null;
    if (!targetClubId && input.organizer_uid) {
      try {
        const organizerUser = await usersService.getById(input.organizer_uid);
        targetClubId = (organizerUser as { club_id?: string; profile?: { club_id?: string } })?.club_id ?? (organizerUser as { club_id?: string; profile?: { club_id?: string } })?.profile?.club_id ?? null;
      } catch {
        targetClubId = null;
      }
    }

    let targetInviteeUids = input.invitee_uids ?? [];
    if ((!targetInviteeUids || targetInviteeUids.length === 0) && targetClubId) {
      try {
        const clubMembers = await usersService.listMembersByClubId(targetClubId);
        targetInviteeUids = clubMembers.map((m) => m.uid).filter((uid) => uid !== input.organizer_uid);
      } catch {
        targetInviteeUids = input.invitee_uids ?? [];
      }
    }

    const rsvps = buildInitialRsvps(targetInviteeUids);
    const ref = await addDoc(collection(database, COL), {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      event_type: input.event_type,
      organizer_uid: input.organizer_uid,
      organizer_name: input.organizer_name,
      club_id: targetClubId,
      club_name: input.club_name ?? null,
      team_id: input.team_id ?? null,
      tournament_id: input.tournament_id ?? null,
      friendly_match_id: input.friendly_match_id ?? null,
      competition_fixture_id: input.competition_fixture_id ?? null,
      starts_at: Timestamp.fromDate(input.starts_at),
      ends_at: input.ends_at ? Timestamp.fromDate(input.ends_at) : null,
      city: input.city.trim(),
      location_label: input.location_label?.trim() || null,
      invitee_uids: targetInviteeUids,
      rsvps,
      rsvp_notes: {},
      attendance_marks: {},
      max_participants: input.max_participants ?? null,
      categories: input.categories ?? [],
      reminder_hours_before: input.reminder_hours_before ?? 24,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    void notifyGuardiansForMinorInvitees(
      database,
      ref.id,
      targetInviteeUids,
      input.title.trim(),
      input.starts_at,
      input.city
    );
    return ref.id;
  },

  /** Convocation match amical (évite les doublons via friendly_match_id). */
  async createFriendlyConvocation(params: {
    matchId: string;
    opponentName: string;
    organizerUid: string;
    organizerName: string;
    clubId: string;
    clubName: string;
    startsAt: Date;
    city: string;
    locationLabel?: string;
    inviteeUids: string[];
    categories?: string[];
  }): Promise<string | null> {
    if (params.inviteeUids.length === 0) return null;

    const existing = (await this.listForUser(params.organizerUid, params.clubId)).find(
      (e) => e.friendly_match_id === params.matchId && e.club_id === params.clubId
    );
    if (existing) return existing.id;

    return this.create({
      title: `Match amical vs ${params.opponentName}`,
      event_type: 'friendly',
      organizer_uid: params.organizerUid,
      organizer_name: params.organizerName,
      club_id: params.clubId,
      club_name: params.clubName,
      friendly_match_id: params.matchId,
      starts_at: params.startsAt,
      city: params.city,
      location_label: params.locationLabel,
      invitee_uids: params.inviteeUids,
      categories: params.categories,
      reminder_hours_before: 24,
    });
  },

  async updateRsvp(eventId: string, uid: string, status: RsvpStatus): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertTeamEventRsvpAccess(event, uid);

    if (
      event.event_type === 'detection' &&
      event.max_participants &&
      status === 'yes'
    ) {
      const yesCount = Object.values({ ...event.rsvps, [uid]: 'yes' }).filter(
        (s) => s === 'yes'
      ).length;
      if (yesCount > event.max_participants) {
        throw new Error('Places complètes pour cette détection.');
      }
    }

    const payload: Record<string, unknown> = {
      [`rsvps.${uid}`]: status,
      updated_at: serverTimestamp(),
    };
    if (!event.invitee_uids.includes(uid)) {
      payload.invitee_uids = arrayUnion(uid);
    }
    await updateDoc(doc(database, COL, eventId), payload);
    if (status === 'yes') {
      const updated = { ...event, rsvps: { ...event.rsvps, [uid]: status } };
      const { teamChatService } = await import('./teamChat.service');
      await teamChatService.ensureTeamThread(updated);
      await syncPlayerActivityFromEvent(updated, uid);
    }
  },

  /** Staff — met à jour le RSVP d’un joueur convoqué (pointage / correction). */
  async updateRsvpAsStaff(
    eventId: string,
    uid: string,
    status: RsvpStatus,
    actor: TeamEventActor,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);

    if (
      event.event_type === 'detection' &&
      event.max_participants &&
      status === 'yes'
    ) {
      const yesCount = Object.values({ ...event.rsvps, [uid]: 'yes' }).filter(
        (s) => s === 'yes',
      ).length;
      if (yesCount > event.max_participants) {
        throw new Error('Places complètes pour cette détection.');
      }
    }

    const payload: Record<string, unknown> = {
      [`rsvps.${uid}`]: status,
      updated_at: serverTimestamp(),
    };
    if (!event.invitee_uids.includes(uid)) {
      payload.invitee_uids = arrayUnion(uid);
    }
    await updateDoc(doc(database, COL, eventId), payload);
    if (status === 'yes' || isLateRsvp(status)) {
      const updated = { ...event, rsvps: { ...event.rsvps, [uid]: status } };
      const { teamChatService } = await import('./teamChat.service');
      await teamChatService.ensureTeamThread(updated);
      await syncPlayerActivityFromEvent(updated, uid);
    }
  },

  async updateRsvpWithReason(
    eventId: string,
    uid: string,
    status: RsvpStatus,
    reason?: string
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertTeamEventRsvpAccess(event, uid);

    const payload: Record<string, unknown> = {
      [`rsvps.${uid}`]: status,
      [`rsvp_notes.${uid}`]: reason?.trim() || null,
      updated_at: serverTimestamp(),
    };
    if (!event.invitee_uids.includes(uid)) payload.invitee_uids = arrayUnion(uid);
    await updateDoc(doc(database, COL, eventId), payload);
    if (status === 'yes' || status === 'late_under_10' || status === 'late_over_10' || status === 'late_unknown') {
      const updated = {
        ...event,
        rsvps: { ...event.rsvps, [uid]: status },
        rsvp_notes: reason?.trim()
          ? { ...event.rsvp_notes, [uid]: reason.trim() }
          : event.rsvp_notes,
      };
      await (await import('./teamChat.service')).teamChatService.ensureTeamThread(updated);
      await syncPlayerActivityFromEvent(updated, uid);
    }
  },

  async reportLate(
    eventId: string,
    uid: string,
    intent: 'under_10' | 'over_10' | 'unknown',
    opts?: {
      note?: string;
      reportedByParent?: boolean;
      playerName?: string;
      /** arrival = enfant en retard à la séance · pickup = parent en retard pour récupérer */
      lateKind?: 'arrival' | 'pickup';
    },
  ): Promise<void> {
    const lateKind = opts?.lateKind ?? 'arrival';
    const { LATE_INTENT_TO_RSVP } = await import('../models/TeamEvent');
    const status = LATE_INTENT_TO_RSVP[intent];
    const label =
      intent === 'under_10'
        ? 'moins de 10 min de retard'
        : intent === 'over_10'
          ? '10 min ou plus de retard'
          : 'un retard (durée inconnue)';

    if (lateKind === 'pickup') {
      const who = `Récupération signalée par le parent de ${opts?.playerName ?? 'joueur'}`;
      const note = [who, label, opts?.note?.trim()].filter(Boolean).join(' · ');
      // Ne change pas le RSVP présence : l’enfant est déjà là / prévu.
      try {
        const event = await this.getById(eventId);
        if (event) {
          const notes = { ...(event.rsvp_notes ?? {}) };
          const key = `${uid}__pickup`;
          notes[key] = note;
          const database = getDb();
          if (database) {
            await updateDoc(doc(database, 'team_events', eventId), {
              rsvp_notes: notes,
              updated_at: serverTimestamp(),
            });
          }
        }
      } catch {
        // best-effort note
      }

      try {
        const event = await this.getById(eventId);
        const name = opts?.playerName ?? 'Un joueur';
        const contextLabel = event
          ? EVENT_TYPE_LABELS[event.event_type] ?? event.event_type
          : 'séance';
        const title = 'Retard récupération';
        const body = `Le parent de ${name} sera en retard (${label}) pour récupérer après ${contextLabel}${event ? ` · ${event.title}` : ''}.`;

        await scheduleProdayLocalNotification({
          identifier: `pickup-late-${eventId}-${uid}`,
          title,
          body,
          data: {
            type: 'parent_pickup_late',
            eventId,
            homeTab: 'convocations',
            playerUid: uid,
          },
        });

        if (event?.club_id) {
          const members = await usersService.listMembersByClubId(event.club_id);
          const staffUids = members
            .filter((m) => m.role === 'coach' || m.role === 'club')
            .map((m) => m.uid)
            .filter((staffUid) => staffUid !== uid);
          if (event.organizer_uid && event.organizer_uid !== uid) {
            staffUids.push(event.organizer_uid);
          }
          await staffNotificationsService.notifyRecipients({
            recipient_uids: staffUids,
            type: 'parent_pickup_late',
            title,
            body,
            event_id: eventId,
            club_id: event.club_id,
            player_uid: uid,
          });
        }
      } catch {
        // best-effort
      }
      return;
    }

    const who = opts?.reportedByParent
      ? `Retard signalé par le parent de ${opts.playerName ?? 'joueur'}`
      : `Retard signalé`;
    const note = [who, label, opts?.note?.trim()].filter(Boolean).join(' · ');
    await this.updateRsvpWithReason(eventId, uid, status, note);

    try {
      const event = await this.getById(eventId);
      const name = opts?.playerName ?? 'Un joueur';
      const contextLabel = event
        ? EVENT_TYPE_LABELS[event.event_type] ?? event.event_type
        : 'séance';
      const title = 'Retard signalé';
      const body = opts?.reportedByParent
        ? `${name} sera en retard (${label}) pour ${contextLabel}${event ? ` · ${event.title}` : ''}. Signalé par le parent.`
        : `${name} sera en retard (${label}) pour ${contextLabel}${event ? ` · ${event.title}` : ''}.`;

      await scheduleProdayLocalNotification({
        identifier: `late-${eventId}-${uid}`,
        title: `⏰ ${title}`,
        body,
        data: {
          type: 'player_late',
          eventId,
          homeTab: 'convocations',
          playerUid: uid,
        },
      });

      // Notifie réellement le staff club (coach / compte club), pas seulement l’appareil du joueur.
      if (event?.club_id) {
        const members = await usersService.listMembersByClubId(event.club_id);
        const staffUids = members
          .filter((m) => m.role === 'coach' || m.role === 'club')
          .map((m) => m.uid)
          .filter((staffUid) => staffUid !== uid);
        if (event.organizer_uid && event.organizer_uid !== uid) {
          staffUids.push(event.organizer_uid);
        }
        await staffNotificationsService.notifyRecipients({
          recipient_uids: staffUids,
          type: 'player_late',
          title,
          body,
          event_id: eventId,
          club_id: event.club_id,
          player_uid: uid,
        });
      }
    } catch {
      // best-effort
    }
  },

  async markAttendance(
    eventId: string,
    uid: string,
    mark: AttendanceMark,
    actor: TeamEventActor,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);
    await updateDoc(doc(database, COL, eventId), {
      [`attendance_marks.${uid}`]: mark,
      updated_at: serverTimestamp(),
      ...(mark === 'present' && isLateRsvp(event.rsvps[uid] ?? 'pending')
        ? { [`rsvps.${uid}`]: 'yes' }
        : {}),
    });
    if (mark === 'present' || mark === 'late') {
      const wasLate = isLateRsvp(event.rsvps[uid] ?? 'pending');
      const updated = {
        ...event,
        attendance_marks: { ...event.attendance_marks, [uid]: mark },
        rsvps:
          mark === 'present' && wasLate
            ? { ...event.rsvps, [uid]: 'yes' as const }
            : event.rsvps,
      };
      await syncPlayerActivityFromEvent(updated, uid);
      await syncTeamEventActivitiesOnServer(eventId);
      if (mark === 'present' && wasLate) {
        try {
          await scheduleProdayLocalNotification({
            identifier: `arrived-${eventId}-${uid}`,
            title: 'Présent',
            body: `Un joueur annoncé en retard est maintenant pointé présent · ${event.title}.`,
            data: { type: 'player_late', eventId, homeTab: 'convocations', playerUid: uid },
          });
        } catch {
          // best-effort
        }
      }
    }
  },

  async sendRsvpReminders(
    eventId: string,
    actor?: TeamEventActor,
  ): Promise<{ remindedCount: number; recipientUids: string[] }> {
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    if (actor) assertManage(event, actor);
    const { executeBulkRsvpReminders } = await import('../utils/coachRsvpReminders');
    const result = await executeBulkRsvpReminders([event], actor);
    return { remindedCount: result.remindedCount, recipientUids: result.recipientUids };
  },

  async sendBulkRsvpReminders(
    events: TeamEvent[],
    actor?: TeamEventActor,
  ): Promise<{ remindedCount: number; eventCount: number }> {
    const { executeBulkRsvpReminders } = await import('../utils/coachRsvpReminders');
    const result = await executeBulkRsvpReminders(events, actor);
    return { remindedCount: result.remindedCount, eventCount: result.eventCount };
  },

  async addInvitees(eventId: string, uids: string[], actor: TeamEventActor): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);

    const merged = [...new Set([...event.invitee_uids, ...uids])];
    const rsvps = { ...event.rsvps };
    for (const uid of uids) {
      if (!rsvps[uid]) rsvps[uid] = 'pending';
    }

    await updateDoc(doc(database, COL, eventId), {
      invitee_uids: merged,
      rsvps,
      updated_at: serverTimestamp(),
    });
  },

  async saveLineup(eventId: string, lineup: EventLineup, actor: TeamEventActor): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);
    await updateDoc(doc(database, COL, eventId), {
      lineup,
      updated_at: serverTimestamp(),
    });
    const updated = { ...event, lineup };
    for (const slot of lineup.slots) {
      await syncPlayerActivityFromEvent(updated, slot.uid);
    }
    await syncTeamEventActivitiesOnServer(eventId);
  },

  async updateSessionPlan(
    eventId: string,
    sessionPlan: import('../models/CoachEvaluation').TrainingSessionPlan | null,
    actor: TeamEventActor,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);
    await updateDoc(doc(database, COL, eventId), {
      session_plan: sessionPlan
        ? {
            focus: sessionPlan.focus?.trim() || null,
            notes: sessionPlan.notes?.trim() || null,
            duration_min: sessionPlan.duration_min ?? null,
            objective_ids: sessionPlan.objective_ids ?? [],
          }
        : null,
      updated_at: serverTimestamp(),
    });
  },

  async deleteEvent(eventId: string, actor: TeamEventActor): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);
    await deleteDoc(doc(database, COL, eventId));
  },

  async endSession(eventId: string, actor: TeamEventActor): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);

    if (isCoachMatchEvent(event)) {
      await this.updateMatchLiveState(eventId, { status: 'finished' }, actor);
      return;
    }

    if (isCoachTrainingEvent(event)) {
      const now = new Date();
      const patch: Record<string, unknown> = {
        live_state: { status: 'finished', home_score: 0, away_score: 0 },
        updated_at: serverTimestamp(),
      };
      if (!event.ends_at) {
        patch.ends_at = Timestamp.fromDate(now);
      }
      await updateDoc(doc(database, COL, eventId), patch);
      return;
    }

    throw new Error('Type d’événement non pris en charge.');
  },

  async updateEventTasks(
    eventId: string,
    tasks: EventTask[],
    actor: TeamEventActor,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);
    await updateDoc(doc(database, COL, eventId), {
      event_tasks: tasks,
      updated_at: serverTimestamp(),
    });
  },

  /** Crée N copies hebdomadaires d’un entraînement (récurrence simple). */
  async createWeeklyRecurrence(
    base: CreateTeamEventInput,
    weeks: number,
  ): Promise<string[]> {
    const count = Math.min(12, Math.max(1, weeks));
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const starts = new Date(base.starts_at.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const ends = base.ends_at
        ? new Date(base.ends_at.getTime() + i * 7 * 24 * 60 * 60 * 1000)
        : undefined;
      const id = await this.create({
        ...base,
        title: i === 0 ? base.title : `${base.title} (S+${i})`,
        starts_at: starts,
        ends_at: ends,
      });
      ids.push(id);
    }
    return ids;
  },

  async addLiveAction(
    eventId: string,
    action: Omit<LiveMatchAction, 'id' | 'created_at'>,
    actor: TeamEventActor,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);

    const entry: LiveMatchAction = {
      ...action,
      id: `live_${Date.now()}`,
      created_at: new Date(),
    };
    const live_actions = [...(event.live_actions ?? []), entry];
    const patch: Record<string, unknown> = {
      live_actions,
      updated_at: serverTimestamp(),
    };
    if (action.type === 'goal') {
      const prev = event.live_state ?? {
        status: 'live' as const,
        home_score: 0,
        away_score: 0,
      };
      patch.live_state = {
        ...prev,
        status: prev.status === 'scheduled' ? 'live' : prev.status,
        home_score: (prev.home_score ?? 0) + 1,
      };
    }
    await updateDoc(doc(database, COL, eventId), patch);
  },

  async updateMatchLiveState(
    eventId: string,
    state: Partial<MatchLiveState>,
    actor: TeamEventActor,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);

    const prev = event.live_state ?? {
      status: 'scheduled' as const,
      home_score: 0,
      away_score: 0,
    };

    await updateDoc(doc(database, COL, eventId), {
      live_state: { ...prev, ...state },
      updated_at: serverTimestamp(),
    });
  },

  async updatePlayerMatchStat(
    eventId: string,
    uid: string,
    patch: Partial<PlayerMatchSheetStat> & { player_name?: string },
    actor: TeamEventActor,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);
    const current = event.player_match_stats?.[uid] ?? {
      uid,
      player_name: patch.player_name ?? 'Joueur',
    };
    const next: PlayerMatchSheetStat = {
      ...current,
      ...patch,
      uid,
      player_name: patch.player_name ?? current.player_name,
    };
    await updateDoc(doc(database, COL, eventId), {
      [`player_match_stats.${uid}`]: next,
      updated_at: serverTimestamp(),
    });
  },

  async setMatchReportFinalized(
    eventId: string,
    finalized: boolean,
    actor: TeamEventActor,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor, { allowWhenReportLocked: true });
    await updateDoc(doc(database, COL, eventId), {
      match_report_finalized_at: finalized ? serverTimestamp() : null,
      updated_at: serverTimestamp(),
    });

    if (finalized && !event.stats_applied_at) {
      try {
        await this.applyPlayerMatchStatsToSeason(eventId, actor);
      } catch (error) {
        console.warn('[teamEvents] applyPlayerMatchStatsToSeason auto:', error);
      }
    }
  },

  /** Importe les actions live vers player_match_stats (coach). */
  async importLiveStatsToMatchSheet(eventId: string, actor: TeamEventActor): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);
    if (!event.live_actions?.length) {
      throw new Error('Aucune action live à importer.');
    }

    const sheets = importLiveActionsToMatchSheet(event);
    await updateDoc(doc(database, COL, eventId), {
      player_match_stats: sheets,
      updated_at: serverTimestamp(),
    });
  },

  /** Propagation feuille match → season_stats après validation rapport. */
  async applyPlayerMatchStatsToSeason(
    eventId: string,
    actor: TeamEventActor,
  ): Promise<void> {
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor, { allowWhenReportLocked: true });
    if (event.stats_applied_at) {
      throw new Error('Les stats ont déjà été appliquées pour cet événement.');
    }
    if (!event.match_report_finalized_at) {
      throw new Error('Validez d’abord le rapport de match avant d’appliquer les stats saison.');
    }

    const sheetUids = collectMatchSheetPlayerUids(event);
    if (sheetUids.length === 0) {
      if (event.live_actions?.length) {
        await this.applyLiveStatsToPlayers(eventId, actor);
        return;
      }
      throw new Error('Aucune feuille de match à appliquer.');
    }

    for (const uid of sheetUids) {
      const sheet = event.player_match_stats![uid];
      const user = await usersService.getPublicById(uid);
      if (!user || user.role !== 'player') continue;
      const delta = seasonDeltaFromMatchSheet(sheet);
      const next = aggregateSeasonStats(user.profile.season_stats, delta);
      await profileService.updateProfile(uid, {
        profile: { season_stats: next },
      });
      await syncPlayerActivityFromEvent(event, uid);
    }

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, COL, eventId), {
      stats_applied_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    await syncTeamEventActivitiesOnServer(eventId);
  },

  async sendReminders(eventId: string): Promise<number> {
    const result = await callFunction<
      { eventId: string },
      { success: boolean; pending: number; pushes: number }
    >('sendEventRemindersCallable', { eventId });
    return result.pending;
  },

  /** Agrège buts/passes du live vers les stats saison des joueurs présents. */
  async applyLiveStatsToPlayers(eventId: string, actor: TeamEventActor): Promise<void> {
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);
    if (!event.live_actions?.length) {
      throw new Error('Aucune action live à enregistrer.');
    }
    if (event.stats_applied_at) {
      throw new Error('Les stats ont déjà été appliquées pour cet événement.');
    }
    if (!event.match_report_finalized_at) {
      throw new Error('Validez d’abord le rapport de match avant d’appliquer les stats saison.');
    }

    const tallies = tallyLiveActionStats(event.live_actions);

    for (const [uid, delta] of Object.entries(tallies)) {
      const user = await usersService.getPublicById(uid);
      if (!user || user.role !== 'player') continue;
      const prev = user.profile.season_stats ?? { matches: 0, goals: 0, assists: 0 };
      await profileService.updateProfile(uid, {
        profile: {
          season_stats: aggregateSeasonStats(prev, {
            matches: 1,
            goals: delta.goals,
            assists: delta.assists,
          }),
        },
      });
    }

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, COL, eventId), {
      stats_applied_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },

  /** Proposition spontanée — joueur ou coach convoqué */
  async volunteerAsCarpoolDriver(
    eventId: string,
    uid: string,
    name: string
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    teamEventsService.assertCarpoolParticipant(event, uid);

    const slots = [...(event.carpool_slots ?? [])];
    if (slots.some((s) => s.driver_uid === uid)) {
      throw new Error('Vous proposez déjà un trajet sur cet événement.');
    }

    slots.push({
      driver_uid: uid,
      driver_name: name,
      volunteered: true,
      passengers: [],
    });

    await updateDoc(doc(database, COL, eventId), {
      carpool_slots: slots,
      event_tasks: teamEventsService.mergeCarpoolTask(event.event_tasks, slots),
      updated_at: serverTimestamp(),
    });
  },

  /** Retrait d’une proposition spontanée */
  async withdrawCarpoolOffer(eventId: string, driverUid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const slot = (event.carpool_slots ?? []).find((s) => s.driver_uid === driverUid);
    if (!slot) throw new Error('Aucun trajet à retirer.');
    if (slot.volunteered !== true) {
      throw new Error('Ce trajet a été assigné par le staff. Contactez votre coach.');
    }

    const carpool_slots = (event.carpool_slots ?? []).filter((s) => s.driver_uid !== driverUid);
    await updateDoc(doc(database, COL, eventId), {
      carpool_slots,
      event_tasks: teamEventsService.mergeCarpoolTask(event.event_tasks, carpool_slots),
      updated_at: serverTimestamp(),
    });
  },

  /** Réserver une place chez un conducteur */
  async requestCarpoolSeat(
    eventId: string,
    driverUid: string,
    passengerUid: string,
    passengerName: string,
    pickup?: { pickup_place?: string; pickup_location?: GeoPoint }
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    teamEventsService.assertCarpoolParticipant(event, passengerUid);

    if (driverUid === passengerUid) {
      throw new Error('Vous ne pouvez pas réserver votre propre véhicule.');
    }

    const existingBooking = findCarpoolBooking(event, passengerUid);
    if (existingBooking && existingBooking.driverUid !== driverUid) {
      throw new Error('Vous avez déjà réservé une place sur un autre trajet.');
    }

    const slots = [...(event.carpool_slots ?? [])];
    const idx = slots.findIndex((s) => s.driver_uid === driverUid);
    if (idx < 0) throw new Error('Trajet introuvable.');

    const slot = slots[idx];
    if (isCarpoolPassenger(slot, passengerUid)) return;

    const available = carpoolAvailableSeats(slot);
    if (available === null) {
      throw new Error('Le conducteur n’a pas encore indiqué le nombre de places.');
    }
    if (available <= 0) throw new Error('Plus de place disponible sur ce trajet.');

    slots[idx] = {
      ...slot,
      passengers: [
        ...(slot.passengers ?? []),
        {
          uid: passengerUid,
          name: passengerName,
          pickup_place: pickup?.pickup_place?.trim() || undefined,
          pickup_location: pickup?.pickup_location,
        },
      ],
    };

    await updateDoc(doc(database, COL, eventId), {
      carpool_slots: slots,
      updated_at: serverTimestamp(),
    });
  },

  /** Passager — mettre à jour son point de prise en charge */
  async updatePassengerPickup(
    eventId: string,
    driverUid: string,
    passengerUid: string,
    pickup: {
      pickup_place?: string;
      pickup_location?: GeoPoint;
    }
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const slots = [...(event.carpool_slots ?? [])];
    const idx = slots.findIndex((s) => s.driver_uid === driverUid);
    if (idx < 0) throw new Error('Trajet introuvable.');

    const slot = slots[idx];
    const passengers = [...(slot.passengers ?? [])];
    const pIdx = passengers.findIndex((p) => p.uid === passengerUid);
    if (pIdx < 0) throw new Error('Réservation introuvable.');

    passengers[pIdx] = {
      ...passengers[pIdx],
      pickup_place: pickup.pickup_place?.trim() || undefined,
      pickup_location: pickup.pickup_location,
    };

    slots[idx] = { ...slot, passengers };
    await updateDoc(doc(database, COL, eventId), {
      carpool_slots: slots,
      updated_at: serverTimestamp(),
    });
  },

  /** Annuler sa réservation */
  async cancelCarpoolSeat(
    eventId: string,
    driverUid: string,
    passengerUid: string
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const slots = [...(event.carpool_slots ?? [])];
    const idx = slots.findIndex((s) => s.driver_uid === driverUid);
    if (idx < 0) throw new Error('Trajet introuvable.');

    const slot = slots[idx];
    if (!isCarpoolPassenger(slot, passengerUid)) {
      throw new Error('Vous n’avez pas réservé sur ce trajet.');
    }

    slots[idx] = {
      ...slot,
      passengers: (slot.passengers ?? []).filter((p) => p.uid !== passengerUid),
    };

    await updateDoc(doc(database, COL, eventId), {
      carpool_slots: slots,
      updated_at: serverTimestamp(),
    });
  },

  assertCarpoolParticipant(event: TeamEvent, uid: string): void {
    if (event.organizer_uid !== uid && !event.invitee_uids.includes(uid)) {
      throw new Error('Réservé aux personnes convoquées à cet événement.');
    }
  },

  mergeCarpoolTask(tasks: EventTask[] | undefined, slots: CarpoolSlot[]): EventTask[] {
    const next = [...(tasks ?? [])];
    const driverUids = slots.map((s) => s.driver_uid);
    const idx = next.findIndex((t) => t.kind === 'carpool');
    const task: EventTask = {
      id: idx >= 0 ? next[idx].id : newEventTaskId(),
      kind: 'carpool',
      label: 'Covoiturage',
      assignee_uids: driverUids,
    };
    if (idx >= 0) next[idx] = task;
    else next.push(task);
    return next;
  },

  /** Coach — désigne les chauffeurs / tâche covoiturage */
  async setCarpoolDrivers(
    eventId: string,
    drivers: { uid: string; name: string }[],
    actor: TeamEventActor,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    assertManage(event, actor);

    const existing = new Map(
      (event.carpool_slots ?? []).map((s) => [s.driver_uid, s])
    );
    const assignedUids = new Set(drivers.map((d) => d.uid));
    const volunteeredKeep = (event.carpool_slots ?? []).filter(
      (s) => s.volunteered === true && !assignedUids.has(s.driver_uid)
    );

    const carpool_slots: CarpoolSlot[] = [
      ...drivers.map((d) => {
        const prev = existing.get(d.uid);
        return {
          driver_uid: d.uid,
          driver_name: d.name,
          seats: prev?.seats,
          vehicle_type: prev?.vehicle_type,
          meeting_time: prev?.meeting_time,
          meeting_place: prev?.meeting_place,
          meeting_location: prev?.meeting_location,
          notes: prev?.notes,
          volunteered: false,
          passengers: prev?.passengers,
          trip_status: prev?.trip_status,
        };
      }),
      ...volunteeredKeep,
    ];

    await updateDoc(doc(database, COL, eventId), {
      carpool_slots,
      event_tasks: teamEventsService.mergeCarpoolTask(event.event_tasks, carpool_slots),
      updated_at: serverTimestamp(),
    });
  },

  /** Proposer ou mettre à jour un trajet (volontariat + détails en une étape) */
  async proposeOrUpdateCarpoolRide(
    eventId: string,
    uid: string,
    name: string,
    patch: Partial<
      Pick<
        CarpoolSlot,
        'seats' | 'vehicle_type' | 'meeting_time' | 'meeting_place' | 'meeting_location' | 'notes'
      >
    >
  ): Promise<void> {
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
    teamEventsService.assertCarpoolParticipant(event, uid);

    const existing = (event.carpool_slots ?? []).find((s) => s.driver_uid === uid);
    if (!existing) {
      await this.volunteerAsCarpoolDriver(eventId, uid, name);
    }
    await this.updateCarpoolSlot(eventId, uid, patch);
  },

  /** Conducteur — places, RDV, notes */
  async updateCarpoolSlot(
    eventId: string,
    driverUid: string,
    patch: Partial<
      Pick<
        CarpoolSlot,
        'seats' | 'vehicle_type' | 'meeting_time' | 'meeting_place' | 'meeting_location' | 'notes'
      >
    >
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const slots = [...(event.carpool_slots ?? [])];
    const idx = slots.findIndex((s) => s.driver_uid === driverUid);
    if (idx < 0) throw new Error('Vous n’êtes pas désigné chauffeur sur cet événement.');

    slots[idx] = { ...slots[idx], ...patch };
    await updateDoc(doc(database, COL, eventId), {
      carpool_slots: slots,
      updated_at: serverTimestamp(),
    });
  },

  /** Conducteur — démarre le trajet événement (géoloc live). */
  async startCarpoolTrip(eventId: string, driverUid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const slots = [...(event.carpool_slots ?? [])];
    const idx = slots.findIndex((s) => s.driver_uid === driverUid);
    if (idx < 0) throw new Error('Vous n’êtes pas chauffeur sur cet événement.');

    const slot = slots[idx];
    nextTripStatusOnStart(slotTripStatus(slot));

    await carpoolLiveTripService.startSharing({
      tripId: eventTripId(eventId, driverUid),
      kind: 'event',
      driverUid,
      participantUids: buildTripParticipantUids(driverUid, slot.passengers),
      eventId,
    });

    slots[idx] = { ...slot, trip_status: 'in_progress' };
    await updateDoc(doc(database, COL, eventId), {
      carpool_slots: slots,
      updated_at: serverTimestamp(),
    });
  },

  /** Conducteur — termine le trajet événement et stoppe le partage. */
  async endCarpoolTrip(eventId: string, driverUid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const slots = [...(event.carpool_slots ?? [])];
    const idx = slots.findIndex((s) => s.driver_uid === driverUid);
    if (idx < 0) throw new Error('Vous n’êtes pas chauffeur sur cet événement.');

    const slot = slots[idx];
    nextTripStatusOnEnd(slotTripStatus(slot));

    await carpoolLiveTripService.stopSharing(eventTripId(eventId, driverUid), driverUid);

    slots[idx] = { ...slot, trip_status: 'completed' };
    await updateDoc(doc(database, COL, eventId), {
      carpool_slots: slots,
      updated_at: serverTimestamp(),
    });
  },

  /** Message de coordination (fil événement) */
  async addCarpoolMessage(
    eventId: string,
    authorUid: string,
    authorName: string,
    body: string
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const text = body.trim();
    if (!text) throw new Error('Message vide.');

    const entry: CarpoolMessage = {
      id: newCarpoolMessageId(),
      author_uid: authorUid,
      author_name: authorName,
      body: text,
      created_at: new Date(),
    };
    const carpool_messages = [...(event.carpool_messages ?? []), entry];
    await updateDoc(doc(database, COL, eventId), {
      carpool_messages,
      updated_at: serverTimestamp(),
    });
  },
};

export type { TeamEventType, LiveActionType, AttendanceMark };
