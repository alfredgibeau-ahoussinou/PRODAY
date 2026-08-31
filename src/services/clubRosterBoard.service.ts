import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  ClubRosterNeed,
  CreateClubRosterNeedInput,
  CreateInternalMoveInput,
  InternalMoveProposal,
  InternalMoveStatus,
} from '../models/ClubRosterBoard';
import { scheduleProdayLocalNotification } from './prodayLocalNotifications.service';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function needFromDoc(id: string, data: Record<string, unknown>): ClubRosterNeed {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    team_id: String(data.team_id ?? ''),
    team_label: String(data.team_label ?? ''),
    category: String(data.category ?? ''),
    position: (data.position as ClubRosterNeed['position']) ?? 'other',
    position_detail: data.position_detail ? String(data.position_detail) : undefined,
    level: data.level ? String(data.level) : undefined,
    preferred_foot: data.preferred_foot as ClubRosterNeed['preferred_foot'],
    profile_notes: data.profile_notes ? String(data.profile_notes) : undefined,
    qualities: Array.isArray(data.qualities) ? (data.qualities as string[]) : undefined,
    urgency: (data.urgency as ClubRosterNeed['urgency']) ?? 'medium',
    players_needed: Number(data.players_needed ?? 1),
    needed_by: data.needed_by ? toDate(data.needed_by) : undefined,
    scope: (data.scope as ClubRosterNeed['scope']) ?? 'internal',
    status: (data.status as ClubRosterNeed['status']) ?? 'open',
    created_by_uid: String(data.created_by_uid ?? ''),
    created_by_name: String(data.created_by_name ?? ''),
    created_at: toDate(data.created_at),
    updated_at: data.updated_at ? toDate(data.updated_at) : undefined,
  };
}

function moveFromDoc(id: string, data: Record<string, unknown>): InternalMoveProposal {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    need_id: data.need_id ? String(data.need_id) : undefined,
    player_uid: String(data.player_uid ?? ''),
    player_name: String(data.player_name ?? ''),
    from_team_id: String(data.from_team_id ?? ''),
    from_team_label: String(data.from_team_label ?? ''),
    to_team_id: String(data.to_team_id ?? ''),
    to_team_label: String(data.to_team_label ?? ''),
    proposed_by_uid: String(data.proposed_by_uid ?? ''),
    proposed_by_name: String(data.proposed_by_name ?? ''),
    current_coach_uid: data.current_coach_uid
      ? String(data.current_coach_uid)
      : undefined,
    match_score: data.match_score != null ? Number(data.match_score) : undefined,
    match_reasons: Array.isArray(data.match_reasons)
      ? (data.match_reasons as string[])
      : undefined,
    message: data.message ? String(data.message) : undefined,
    status: (data.status as InternalMoveStatus) ?? 'proposed',
    created_at: toDate(data.created_at),
    updated_at: data.updated_at ? toDate(data.updated_at) : undefined,
  };
}

export const clubRosterBoardService = {
  async createNeed(input: CreateClubRosterNeedInput): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const ref = await addDoc(collection(database, 'club_roster_needs'), {
      club_id: input.club_id,
      team_id: input.team_id,
      team_label: input.team_label,
      category: input.category,
      position: input.position,
      position_detail: input.position_detail ?? null,
      level: input.level ?? null,
      preferred_foot: input.preferred_foot ?? 'any',
      profile_notes: input.profile_notes ?? '',
      qualities: input.qualities ?? [],
      urgency: input.urgency ?? 'medium',
      players_needed: input.players_needed,
      needed_by: input.needed_by ? Timestamp.fromDate(input.needed_by) : null,
      scope: input.scope ?? 'internal',
      status: 'open',
      created_by_uid: input.created_by_uid,
      created_by_name: input.created_by_name,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async listNeedsForClub(clubId: string, scope?: 'internal' | 'external'): Promise<ClubRosterNeed[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'club_roster_needs'),
        where('club_id', '==', clubId),
        where('status', '==', 'open'),
        orderBy('created_at', 'desc'),
        limit(60),
      );
      const snap = await getDocs(q);
      let rows = snap.docs.map((d) => needFromDoc(d.id, d.data() as Record<string, unknown>));
      if (scope) rows = rows.filter((n) => n.scope === scope);
      return rows;
    } catch {
      const snap = await getDocs(collection(database, 'club_roster_needs'));
      return snap.docs
        .map((d) => needFromDoc(d.id, d.data() as Record<string, unknown>))
        .filter((n) => n.club_id === clubId && n.status === 'open')
        .filter((n) => (scope ? n.scope === scope : true))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  async listExternalNeeds(excludeClubId?: string): Promise<ClubRosterNeed[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'club_roster_needs'),
        where('scope', '==', 'external'),
        where('status', '==', 'open'),
        limit(40),
      );
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => needFromDoc(d.id, d.data() as Record<string, unknown>))
        .filter((n) => !excludeClubId || n.club_id !== excludeClubId);
    } catch {
      return [];
    }
  },

  async proposeInternalMove(input: CreateInternalMoveInput): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const ref = await addDoc(collection(database, 'club_internal_moves'), {
      club_id: input.club_id,
      need_id: input.need_id ?? null,
      player_uid: input.player_uid,
      player_name: input.player_name,
      from_team_id: input.from_team_id,
      from_team_label: input.from_team_label,
      to_team_id: input.to_team_id,
      to_team_label: input.to_team_label,
      proposed_by_uid: input.proposed_by_uid,
      proposed_by_name: input.proposed_by_name,
      current_coach_uid: input.current_coach_uid ?? null,
      match_score: input.match_score ?? null,
      match_reasons: input.match_reasons ?? [],
      message: input.message ?? '',
      status: 'proposed',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    try {
      await scheduleProdayLocalNotification({
        identifier: `internal-move-${ref.id}`,
        title: 'Bourse de recrutement',
        body: `${input.proposed_by_name} propose ${input.player_name} (${input.from_team_label} vers ${input.to_team_label}).`,
        data: {
          type: 'internal_move',
          homeTab: 'home',
          moveId: ref.id,
          playerUid: input.player_uid,
        },
      });
    } catch {
      // best-effort
    }
    return ref.id;
  },

  async listMovesForClub(clubId: string): Promise<InternalMoveProposal[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'club_internal_moves'),
        where('club_id', '==', clubId),
        orderBy('created_at', 'desc'),
        limit(40),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => moveFromDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, 'club_internal_moves'));
      return snap.docs
        .map((d) => moveFromDoc(d.id, d.data() as Record<string, unknown>))
        .filter((m) => m.club_id === clubId)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  async setMoveStatus(
    moveId: string,
    status: InternalMoveStatus,
    notify?: {
      playerUid: string;
      playerName: string;
      toTeamLabel: string;
      actorName: string;
    },
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'club_internal_moves', moveId), {
      status,
      updated_at: serverTimestamp(),
    });

    if (!notify) return;
    try {
      const body =
        status === 'accepted'
          ? `${notify.actorName} a validé votre intégration vers ${notify.toTeamLabel}.`
          : status === 'completed'
            ? `Intégration effectuée : ${notify.playerName} vers ${notify.toTeamLabel}.`
            : status === 'declined'
              ? `Proposition refusée pour ${notify.toTeamLabel}.`
              : null;
      if (body) {
        await scheduleProdayLocalNotification({
          identifier: `internal-move-${moveId}-${status}`,
          title: 'Bourse de recrutement',
          body,
          data: {
            type: 'internal_move',
            homeTab: 'home',
            moveId,
            playerUid: notify.playerUid,
          },
        });
      }
    } catch {
      // best-effort
    }
  },
};
