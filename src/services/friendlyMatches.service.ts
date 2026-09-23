import {
  collection,
  doc,
  getDocs,
  getDoc,
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
import { friendlyMatchFromFirestore } from '../lib/firestoreMappers';
import type {
  FriendlyMatch,
  CreateFriendlyMatchInput,
  CounterProposeFriendlyMatchInput,
  FriendlyVenueSide,
  FriendlyMatchStatus,
} from '../models/FriendlyMatch';
import { scheduleProdayLocalNotification } from './prodayLocalNotifications.service';
import { staffNotificationsService } from './staffNotifications.service';
import { usersService } from './users.service';
import { teamEventsService } from './teamEvents.service';

export interface CoachOrganizeFriendlyMatchInput {
  coachUid: string;
  coachName: string;
  clubId: string;
  clubName: string;
  teamId: string;
  teamLabel: string;
  isExternalOpponent: boolean;
  opponentClubId?: string;
  opponentClubName: string;
  opponentTeamId?: string;
  opponentTeamLabel?: string;
  opponentCity?: string;
  opponentContact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  category: string;
  gameFormat: 'foot_11' | 'foot_8' | 'futsal' | string;
  date: Date;
  kickoffTime: string;
  meetingTime?: string;
  timezone?: string;
  venueSide: FriendlyVenueSide;
  venueAddress?: string;
  city: string;
  level?: string;
  levelType?: 'loisir' | 'competition' | 'mixte';
  rules?: {
    halfDurationMinutes?: number;
    jerseysNotes?: string;
    refereeingNotes?: string;
    hostingNotes?: string;
  };
  notes?: string;
  action: 'invite' | 'confirm' | 'draft';
  inviteeUids?: string[];
}

function toTimestampDate(d: Date) {
  return Timestamp.fromDate(d);
}

export const friendlyMatchesService = {
  async listUpcoming(max = 60): Promise<FriendlyMatch[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'friendly_matches'),
        orderBy('date', 'asc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        friendlyMatchFromFirestore(d.id, d.data() as Record<string, unknown>),
      );
    } catch {
      const snap = await getDocs(collection(database, 'friendly_matches'));
      return snap.docs
        .map((d) => friendlyMatchFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    }
  },

  async listOpenForSearch(levelType?: string): Promise<FriendlyMatch[]> {
    const all = await this.listUpcoming();
    return all.filter((m) => {
      if (m.status !== 'OPEN' && m.status !== 'ACCEPTED') return false;
      if (levelType && levelType !== 'Tous' && m.level_type !== levelType.toLowerCase()) {
        const map: Record<string, string> = {
          Loisir: 'loisir',
          Compétition: 'competition',
          Mixte: 'mixte',
        };
        if (map[levelType] && m.level_type !== map[levelType]) return false;
      }
      return true;
    });
  },

  /** Invitations / matchs liés à un club (envoyés ou reçus). */
  async listForClub(clubId: string): Promise<FriendlyMatch[]> {
    const all = await this.listUpcoming(120);
    return all.filter(
      (m) => m.requester_club_id === clubId || m.opponent_club_id === clubId,
    );
  },

  async create(input: CreateFriendlyMatchInput): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const direct = input.mode === 'direct' && Boolean(input.opponent_club_id);
    const status = direct ? 'INVITED' : 'OPEN';

    const ref = await addDoc(collection(database, 'friendly_matches'), {
      requester_uid: input.requester_uid,
      requester_club_id: input.requester_club_id,
      requester_club_name: input.requester_club_name,
      opponent_club_id: input.opponent_club_id ?? null,
      opponent_club_name: input.opponent_club_name ?? null,
      requester_team_id: input.requester_team_id ?? null,
      requester_team_label: input.requester_team_label ?? null,
      city: input.city,
      date: toTimestampDate(input.date),
      time_label: input.time_label,
      category: input.category,
      level: input.level,
      level_type: input.level_type,
      match_kind: input.match_kind ?? 'amical',
      venue_side: input.venue_side ?? 'home',
      has_pitch: true,
      message: input.message ?? '',
      status,
      location: input.location
        ? { latitude: input.location.latitude, longitude: input.location.longitude }
        : null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    if (direct && input.opponent_club_id) {
      const title = 'Invitation de match';
      const body = `Le club ${input.requester_club_name} propose un match (${input.date.toLocaleDateString('fr-FR')} · ${input.time_label} · ${input.city}).`;
      try {
        await scheduleProdayLocalNotification({
          identifier: `friendly-invite-${ref.id}`,
          title,
          body,
          data: { type: 'friendly_invite', homeTab: 'matches', matchId: ref.id },
        });
      } catch {
        // notification locale best-effort
      }
      try {
        const members = await usersService.listMembersByClubId(input.opponent_club_id);
        const staffUids = members
          .filter((m) => m.role === 'coach' || m.role === 'club')
          .map((m) => m.uid)
          .filter((uid) => uid !== input.requester_uid);
        await staffNotificationsService.notifyRecipients({
          recipient_uids: staffUids,
          type: 'friendly_invite',
          title,
          body,
          club_id: input.opponent_club_id,
        });
      } catch {
        // best-effort inbox staff
      }
    }

    return ref.id;
  },

  async getById(matchId: string): Promise<FriendlyMatch | null> {
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, 'friendly_matches', matchId));
    if (!snap.exists()) return null;
    return friendlyMatchFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async acceptMatch(
    matchId: string,
    accepterClubId: string,
    accepterClubName: string,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const snap = await getDoc(doc(database, 'friendly_matches', matchId));
    if (!snap.exists()) throw new Error('Match introuvable.');
    const data = snap.data();
    const status = String(data.status ?? '');
    if (status !== 'OPEN' && status !== 'INVITED' && status !== 'COUNTERED') {
      throw new Error('Ce match n’est plus disponible.');
    }

    // Contre-proposition : seul le demandeur initial peut accepter le contre.
    if (status === 'COUNTERED') {
      if (String(data.requester_club_id) !== accepterClubId) {
        throw new Error('Seul le club demandeur peut accepter la contre-proposition.');
      }
      const counter = data.counter_proposal as Record<string, unknown> | undefined;
      const patch: Record<string, unknown> = {
        status: 'ACCEPTED',
        opponent_club_id: data.opponent_club_id ?? accepterClubId,
        opponent_club_name: data.opponent_club_name ?? accepterClubName,
        updated_at: serverTimestamp(),
        counter_proposal: null,
      };
      if (counter) {
        if (counter.date) patch.date = counter.date;
        if (counter.time_label) patch.time_label = counter.time_label;
        if (counter.city) patch.city = counter.city;
        if (counter.venue_side) patch.venue_side = counter.venue_side;
        if (counter.team_label) patch.requester_team_label = counter.team_label;
      }
      await updateDoc(doc(database, 'friendly_matches', matchId), patch);
      return;
    }

    // Invitation dirigée : seul le club destinataire accepte.
    if (status === 'INVITED') {
      const targetId = data.opponent_club_id ? String(data.opponent_club_id) : '';
      if (targetId && targetId !== accepterClubId) {
        throw new Error('Cette invitation est destinée à un autre club.');
      }
    }

    await updateDoc(doc(database, 'friendly_matches', matchId), {
      status: 'ACCEPTED',
      opponent_club_id: accepterClubId,
      opponent_club_name: accepterClubName,
      updated_at: serverTimestamp(),
    });
  },

  async declineMatch(matchId: string, clubId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const snap = await getDoc(doc(database, 'friendly_matches', matchId));
    if (!snap.exists()) throw new Error('Match introuvable.');
    const data = snap.data();
    const status = String(data.status ?? '');
    if (status !== 'INVITED' && status !== 'COUNTERED' && status !== 'OPEN') {
      throw new Error('Impossible de refuser ce match.');
    }
    const isTarget =
      String(data.opponent_club_id ?? '') === clubId ||
      (status === 'OPEN' && String(data.requester_club_id) !== clubId);
    const isRequesterOnCounter =
      status === 'COUNTERED' && String(data.requester_club_id) === clubId;
    if (!isTarget && !isRequesterOnCounter) {
      throw new Error('Vous ne pouvez pas refuser cette invitation.');
    }
    await updateDoc(doc(database, 'friendly_matches', matchId), {
      status: 'DECLINED',
      updated_at: serverTimestamp(),
    });
  },

  async counterPropose(input: CounterProposeFriendlyMatchInput): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const snap = await getDoc(doc(database, 'friendly_matches', input.matchId));
    if (!snap.exists()) throw new Error('Match introuvable.');
    const data = snap.data();
    const status = String(data.status ?? '');
    if (status !== 'INVITED' && status !== 'OPEN') {
      throw new Error('Contre-proposition impossible sur ce statut.');
    }
    const targetId = data.opponent_club_id ? String(data.opponent_club_id) : '';
    if (status === 'INVITED' && targetId && targetId !== input.clubId) {
      throw new Error('Seul le club invité peut proposer une autre date.');
    }
    if (String(data.requester_club_id) === input.clubId) {
      throw new Error('Utilisez une nouvelle invitation pour modifier votre proposition.');
    }

    await updateDoc(doc(database, 'friendly_matches', input.matchId), {
      status: 'COUNTERED',
      opponent_club_id: data.opponent_club_id ?? input.clubId,
      opponent_club_name: data.opponent_club_name ?? input.clubName,
      counter_proposal: {
        proposed_by_club_id: input.clubId,
        proposed_by_club_name: input.clubName,
        date: toTimestampDate(input.date),
        time_label: input.time_label,
        city: input.city,
        venue_side: input.venue_side ?? null,
        team_label: input.team_label ?? null,
        message: input.message ?? '',
        created_at: serverTimestamp(),
      },
      updated_at: serverTimestamp(),
    });

    try {
      await scheduleProdayLocalNotification({
        identifier: `friendly-counter-${input.matchId}`,
        title: 'Contre-proposition de match',
        body: `Le club ${input.clubName} propose une autre date / un autre lieu.`,
        data: { type: 'friendly_counter', homeTab: 'matches', matchId: input.matchId },
      });
    } catch {
      // best-effort
    }
  },

  async cancelMatch(matchId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'friendly_matches', matchId), {
      status: 'CANCELLED',
      updated_at: serverTimestamp(),
    });
  },

  async markPlayed(matchId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'friendly_matches', matchId), {
      status: 'PLAYED',
      updated_at: serverTimestamp(),
    });
  },

  async organizeCoachFriendlyMatch(
    input: CoachOrganizeFriendlyMatchInput,
  ): Promise<{ friendlyMatchId: string; eventId: string; isDuplicate?: boolean }> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    // Anti-doublon friendly_matches
    const upcoming = await this.listForClub(input.clubId);
    const existing = upcoming.find((m) => {
      if (m.status === 'CANCELLED' || m.status === 'DECLINED') return false;
      if (m.requester_team_id && m.requester_team_id !== input.teamId) return false;
      const diff = Math.abs(m.date.getTime() - input.date.getTime());
      if (diff > 3 * 3600 * 1000) return false;
      if (!input.isExternalOpponent && input.opponentClubId) {
        return m.opponent_club_id === input.opponentClubId;
      }
      return (
        (m.opponent_club_name || '').toLowerCase().trim() === input.opponentClubName.toLowerCase().trim() ||
        (m.external_opponent_club_name || '').toLowerCase().trim() === input.opponentClubName.toLowerCase().trim()
      );
    });

    if (existing) {
      let linkedId = existing.linked_event_id;
      if (!linkedId) {
        try {
          const events = await teamEventsService.listForUser(input.coachUid, input.clubId);
          const ev = events.find((e) => e.friendly_match_id === existing.id);
          if (ev) linkedId = ev.id;
        } catch {
          // best-effort
        }
      }
      return { friendlyMatchId: existing.id, eventId: linkedId ?? '', isDuplicate: true };
    }

    const status: FriendlyMatchStatus =
      input.action === 'draft'
        ? 'DRAFT'
        : input.action === 'confirm'
        ? 'ACCEPTED'
        : input.opponentClubId
        ? 'INVITED'
        : 'OPEN';

    const matchRef = await addDoc(collection(database, 'friendly_matches'), {
      requester_uid: input.coachUid,
      requester_club_id: input.clubId,
      requester_club_name: input.clubName,
      requester_team_id: input.teamId,
      requester_team_label: input.teamLabel,
      opponent_club_id: input.isExternalOpponent ? null : (input.opponentClubId ?? null),
      opponent_club_name: input.opponentClubName,
      opponent_team_id: input.opponentTeamId ?? null,
      opponent_team_label: input.opponentTeamLabel ?? null,
      city: input.city,
      date: toTimestampDate(input.date),
      time_label: input.kickoffTime,
      meeting_time_label: input.meetingTime ?? null,
      timezone: input.timezone ?? 'Europe/Paris',
      category: input.category,
      game_format: input.gameFormat,
      level: input.level ?? 'Régional',
      level_type: input.levelType ?? 'competition',
      match_kind: 'amical',
      venue_side: input.venueSide,
      venue_address: input.venueAddress ?? null,
      has_pitch: true,
      message: input.notes ?? '',
      rules_half_duration_min:
        input.rules?.halfDurationMinutes ??
        (input.gameFormat === 'foot_11' ? 45 : input.gameFormat === 'foot_8' ? 30 : 25),
      rules_jerseys: input.rules?.jerseysNotes ?? null,
      rules_refereeing: input.rules?.refereeingNotes ?? null,
      rules_hosting_notes: input.rules?.hostingNotes ?? null,
      is_external_opponent: input.isExternalOpponent,
      external_opponent_club_name: input.isExternalOpponent ? input.opponentClubName : null,
      external_opponent_city: input.isExternalOpponent ? (input.opponentCity ?? input.city) : null,
      external_opponent_contact_name: input.opponentContact?.name ?? null,
      external_opponent_contact_phone: input.opponentContact?.phone ?? null,
      external_opponent_contact_email: input.opponentContact?.email ?? null,
      status,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    if (status === 'INVITED' && input.opponentClubId) {
      const title = 'Invitation match amical';
      const body = `Le coach ${input.coachName} (${input.clubName} · ${input.teamLabel}) vous propose un match amical (${input.date.toLocaleDateString('fr-FR')} · ${input.kickoffTime} · ${input.city}).`;
      try {
        await scheduleProdayLocalNotification({
          identifier: `friendly-invite-${matchRef.id}`,
          title,
          body,
          data: { type: 'friendly_invite', homeTab: 'matches', matchId: matchRef.id },
        });
      } catch {
        // notification locale best-effort
      }
      try {
        const members = await usersService.listMembersByClubId(input.opponentClubId);
        const staffUids = members
          .filter((m) => m.role === 'coach' || m.role === 'club')
          .map((m) => m.uid)
          .filter((uid) => uid !== input.coachUid);
        await staffNotificationsService.notifyRecipients({
          recipient_uids: staffUids,
          type: 'friendly_invite',
          title,
          body,
          club_id: input.opponentClubId,
        });
      } catch {
        // best-effort
      }
    }

    const venueSideLabel =
      input.venueSide === 'home'
        ? 'Domicile'
        : input.venueSide === 'away'
        ? 'Extérieur'
        : 'Terrain neutre';
    const locationLabel = input.venueAddress
      ? `${input.venueAddress} (${venueSideLabel})`
      : `${venueSideLabel} · ${input.city}`;

    const titlePrefix = input.action === 'draft' ? '[Brouillon] ' : '';
    const title = `${titlePrefix}Match amical vs ${input.opponentClubName}`;

    const startsAt = new Date(input.date);
    const [hh, mm] = (input.kickoffTime || '15:00').split(':').map((v) => parseInt(v, 10) || 0);
    startsAt.setHours(hh, mm, 0, 0);

    const endsAt = new Date(startsAt.getTime() + 2 * 3600 * 1000);

    const descParts = [
      input.notes?.trim(),
      `Format: ${input.gameFormat === 'foot_11' ? 'Foot à 11' : input.gameFormat === 'foot_8' ? 'Foot à 8' : input.gameFormat === 'futsal' ? 'Futsal' : input.gameFormat}`,
      input.meetingTime ? `RDV vestiaires: ${input.meetingTime}` : null,
      input.rules?.halfDurationMinutes ? `Mi-temps: 2x${input.rules.halfDurationMinutes} min` : null,
      input.rules?.jerseysNotes ? `Maillots: ${input.rules.jerseysNotes}` : null,
      input.rules?.refereeingNotes ? `Arbitrage: ${input.rules.refereeingNotes}` : null,
      input.rules?.hostingNotes ? `Accueil: ${input.rules.hostingNotes}` : null,
      input.isExternalOpponent && input.opponentContact?.name
        ? `Contact adverse: ${input.opponentContact.name}${input.opponentContact.phone ? ` (${input.opponentContact.phone})` : ''}`
        : null,
    ].filter(Boolean);

    const eventId = await teamEventsService.create({
      title,
      description: descParts.join(' · '),
      event_type: 'friendly',
      organizer_uid: input.coachUid,
      organizer_name: input.coachName,
      club_id: input.clubId,
      club_name: input.clubName,
      team_id: input.teamId,
      friendly_match_id: matchRef.id,
      starts_at: startsAt,
      ends_at: endsAt,
      city: input.city,
      location_label: locationLabel,
      invitee_uids: input.inviteeUids ?? [],
      categories: [input.category],
      reminder_hours_before: 24,
      live_state: {
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
        opponent_name: input.opponentClubName,
        home_label: input.clubName,
      },
      carpool_slots: [],
      transport_plan: {
        mode: 'carpool_only',
        buses: [],
        independent_traveler_uids: [],
        notes: 'Covoiturage et transport activés pour ce match amical',
      },
    });

    await updateDoc(doc(database, 'friendly_matches', matchRef.id), {
      linked_event_id: eventId,
      updated_at: serverTimestamp(),
    });

    return {
      friendlyMatchId: matchRef.id,
      eventId,
      isDuplicate: false,
    };
  },
};
