import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
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
import type { Tournament } from '../models/Tournament';
import { callFunction } from '../lib/firebaseFunctions';
import { usersService } from './users.service';
import { profileService } from './profile.service';

const COL = 'team_events';

function buildInitialRsvps(inviteeUids: string[]): Record<string, RsvpStatus> {
  const rsvps: Record<string, RsvpStatus> = {};
  for (const uid of inviteeUids) rsvps[uid] = 'pending';
  return rsvps;
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

    const rsvps = buildInitialRsvps(input.invitee_uids);
    const ref = await addDoc(collection(database, COL), {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      event_type: input.event_type,
      organizer_uid: input.organizer_uid,
      organizer_name: input.organizer_name,
      club_id: input.club_id ?? null,
      club_name: input.club_name ?? null,
      tournament_id: input.tournament_id ?? null,
      friendly_match_id: input.friendly_match_id ?? null,
      starts_at: Timestamp.fromDate(input.starts_at),
      ends_at: input.ends_at ? Timestamp.fromDate(input.ends_at) : null,
      city: input.city.trim(),
      location_label: input.location_label?.trim() || null,
      invitee_uids: input.invitee_uids,
      rsvps,
      rsvp_notes: {},
      attendance_marks: {},
      max_participants: input.max_participants ?? null,
      categories: input.categories ?? [],
      reminder_hours_before: input.reminder_hours_before ?? 24,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  /** Convocation équipe après inscription tournoi Arena (évite les doublons). */
  async createTournamentConvocation(
    tournament: Tournament,
    organizerUid: string,
    organizerName: string,
    clubId: string,
    clubName: string,
    inviteeUids: string[]
  ): Promise<string | null> {
    if (inviteeUids.length === 0) return null;

    const existing = (await this.listForUser(organizerUid, clubId)).find(
      (e) => e.tournament_id === tournament.id && e.club_id === clubId
    );
    if (existing) return existing.id;

    return this.create({
      title: `Tournoi — ${tournament.name}`,
      description: `Convocation Arena · ${tournament.categories?.join(', ') ?? ''}`,
      event_type: 'tournament',
      organizer_uid: organizerUid,
      organizer_name: organizerName,
      club_id: clubId,
      club_name: clubName,
      tournament_id: tournament.id,
      starts_at: tournament.date_start,
      ends_at: tournament.date_end,
      city: tournament.city,
      invitee_uids: inviteeUids,
      categories: tournament.categories,
      reminder_hours_before: 48,
    });
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

    const payload: Record<string, unknown> = {
      [`rsvps.${uid}`]: status,
      [`rsvp_notes.${uid}`]: reason?.trim() || null,
      updated_at: serverTimestamp(),
    };
    if (!event.invitee_uids.includes(uid)) payload.invitee_uids = arrayUnion(uid);
    await updateDoc(doc(database, COL, eventId), payload);
  },

  async markAttendance(
    eventId: string,
    uid: string,
    mark: AttendanceMark
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, COL, eventId), {
      [`attendance_marks.${uid}`]: mark,
      updated_at: serverTimestamp(),
    });
  },

  async addInvitees(eventId: string, uids: string[]): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

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

  async saveLineup(eventId: string, lineup: EventLineup): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, COL, eventId), {
      lineup,
      updated_at: serverTimestamp(),
    });
  },

  async addLiveAction(
    eventId: string,
    action: Omit<LiveMatchAction, 'id' | 'created_at'>
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');

    const entry: LiveMatchAction = {
      ...action,
      id: `live_${Date.now()}`,
      created_at: new Date(),
    };
    const live_actions = [...(event.live_actions ?? []), entry];
    await updateDoc(doc(database, COL, eventId), {
      live_actions,
      updated_at: serverTimestamp(),
    });
  },

  async updatePlayerMatchStat(
    eventId: string,
    uid: string,
    patch: Partial<PlayerMatchSheetStat> & { player_name?: string }
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable');
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

  async setMatchReportFinalized(eventId: string, finalized: boolean): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, COL, eventId), {
      match_report_finalized_at: finalized ? serverTimestamp() : null,
      updated_at: serverTimestamp(),
    });
  },

  async sendReminders(eventId: string): Promise<number> {
    const result = await callFunction<
      { eventId: string },
      { success: boolean; pending: number; pushes: number }
    >('sendEventRemindersCallable', { eventId });
    return result.pending;
  },

  /** Agrège buts/passes du live vers les stats saison des joueurs présents. */
  async applyLiveStatsToPlayers(eventId: string): Promise<void> {
    const event = await this.getById(eventId);
    if (!event?.live_actions?.length) {
      throw new Error('Aucune action live à enregistrer.');
    }
    if (event.stats_applied_at) {
      throw new Error('Les stats ont déjà été appliquées pour cet événement.');
    }

    const tallies: Record<string, { goals: number; assists: number }> = {};
    for (const a of event.live_actions) {
      if (!tallies[a.player_uid]) tallies[a.player_uid] = { goals: 0, assists: 0 };
      if (a.type === 'goal') tallies[a.player_uid].goals += 1;
      if (a.type === 'assist') tallies[a.player_uid].assists += 1;
    }

    for (const [uid, delta] of Object.entries(tallies)) {
      const user = await usersService.getById(uid);
      if (!user || user.role !== 'player') continue;
      const prev = user.profile.season_stats ?? { matches: 0, goals: 0, assists: 0 };
      await profileService.updateProfile(uid, {
        profile: {
          season_stats: {
            matches: prev.matches + 1,
            goals: prev.goals + delta.goals,
            assists: prev.assists + delta.assists,
          },
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
};

export type { TeamEventType, LiveActionType, AttendanceMark };
