import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
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
  PlayerExtraSession,
  CreatePlayerExtraSessionInput,
  ExtraSessionParticipant,
} from '../models/PlayerExtraSession';
import { staffNotificationsService } from './staffNotifications.service';

const COL = 'player_extra_sessions';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function mapDoc(id: string, data: Record<string, unknown>): PlayerExtraSession {
  const rawParts = Array.isArray(data.participants) ? data.participants : [];
  const participants: ExtraSessionParticipant[] = rawParts.map((p: Record<string, unknown>) => ({
    uid: String(p.uid ?? ''),
    display_name: String(p.display_name ?? ''),
    avatar_url: p.avatar_url ? String(p.avatar_url) : undefined,
    is_minor: Boolean(p.is_minor),
    parent_notified: Boolean(p.parent_notified),
    parent_approved: Boolean(p.parent_approved),
    joined_at: toDate(p.joined_at),
  }));

  return {
    id,
    club_id: String(data.club_id ?? ''),
    team_id: data.team_id ? String(data.team_id) : undefined,
    organizer_uid: String(data.organizer_uid ?? ''),
    organizer_name: String(data.organizer_name ?? ''),
    title: String(data.title ?? 'Séance extra'),
    description: String(data.description ?? ''),
    location_name: String(data.location_name ?? ''),
    location_address: data.location_address ? String(data.location_address) : undefined,
    starts_at: toDate(data.starts_at),
    ends_at: toDate(data.ends_at),
    max_participants: Number(data.max_participants ?? 10),
    participants,
    is_cancelled: Boolean(data.is_cancelled),
    cancellation_reason: data.cancellation_reason ? String(data.cancellation_reason) : undefined,
    requires_parent_supervision: Boolean(data.requires_parent_supervision),
    supervising_adult_name: data.supervising_adult_name ? String(data.supervising_adult_name) : undefined,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export const playerExtraSessionsService = {
  /**
   * Crée une nouvelle séance extra proposée par un joueur.
   */
  async createSession(input: CreatePlayerExtraSessionInput): Promise<PlayerExtraSession> {
    const database = getDb();
    const now = new Date();

    const initialParticipant: ExtraSessionParticipant = {
      uid: input.organizer_uid,
      display_name: input.organizer_name,
      joined_at: now,
    };

    const payload: Record<string, unknown> = {
      club_id: input.club_id,
      team_id: input.team_id ?? null,
      organizer_uid: input.organizer_uid,
      organizer_name: input.organizer_name,
      title: input.title.trim(),
      description: input.description.trim(),
      location_name: input.location_name.trim(),
      location_address: input.location_address?.trim() ?? null,
      starts_at: Timestamp.fromDate(input.starts_at),
      ends_at: Timestamp.fromDate(input.ends_at),
      max_participants: input.max_participants,
      participants: [
        {
          uid: initialParticipant.uid,
          display_name: initialParticipant.display_name,
          joined_at: Timestamp.fromDate(now),
        },
      ],
      is_cancelled: false,
      cancellation_reason: null,
      requires_parent_supervision: Boolean(input.requires_parent_supervision),
      supervising_adult_name: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    let id = `extra_${Date.now()}`;
    if (database && isFirebaseConfigured()) {
      const ref = await addDoc(collection(database, COL), payload);
      id = ref.id;
    }

    return {
      id,
      club_id: input.club_id,
      team_id: input.team_id,
      organizer_uid: input.organizer_uid,
      organizer_name: input.organizer_name,
      title: input.title.trim(),
      description: input.description.trim(),
      location_name: input.location_name.trim(),
      location_address: input.location_address?.trim(),
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      max_participants: input.max_participants,
      participants: [initialParticipant],
      is_cancelled: false,
      requires_parent_supervision: Boolean(input.requires_parent_supervision),
      created_at: now,
      updated_at: now,
    };
  },

  /**
   * Liste les séances extra actives au sein du club.
   */
  async listForClub(clubId: string, max = 30): Promise<PlayerExtraSession[]> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !clubId) return [];
    try {
      const q = query(
        collection(database, COL),
        where('club_id', '==', clubId),
        orderBy('starts_at', 'asc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('club_id', '==', clubId), limit(max)),
      );
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
    }
  },

  /**
   * Un joueur rejoint la séance (avec contrôle de capacité et dédoublonnage).
   */
  async joinSession(
    sessionId: string,
    participant: {
      uid: string;
      display_name: string;
      avatar_url?: string;
      is_minor?: boolean;
      parent_approved?: boolean;
    },
  ): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, sessionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Séance introuvable.');

    const session = mapDoc(snap.id, snap.data() as Record<string, unknown>);
    if (session.is_cancelled) throw new Error('Cette séance a été annulée.');

    // Vérifier si déjà inscrit (dédoublonnage)
    if (session.participants.some((p) => p.uid === participant.uid)) {
      return;
    }

    // Vérifier la capacité
    if (session.participants.length >= session.max_participants) {
      throw new Error('La capacité maximale de cette séance est atteinte.');
    }

    const newPart: ExtraSessionParticipant = {
      uid: participant.uid,
      display_name: participant.display_name,
      avatar_url: participant.avatar_url,
      is_minor: participant.is_minor,
      parent_notified: Boolean(participant.is_minor),
      parent_approved: participant.parent_approved,
      joined_at: new Date(),
    };

    const updatedParticipants = [...session.participants, newPart];

    await updateDoc(ref, {
      participants: updatedParticipants.map((p) => ({
        ...p,
        joined_at: Timestamp.fromDate(p.joined_at),
      })),
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Quitter la séance.
   */
  async leaveSession(sessionId: string, playerUid: string): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, sessionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const session = mapDoc(snap.id, snap.data() as Record<string, unknown>);
    const filtered = session.participants.filter((p) => p.uid !== playerUid);

    await updateDoc(ref, {
      participants: filtered.map((p) => ({
        ...p,
        joined_at: Timestamp.fromDate(p.joined_at),
      })),
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Annulation de la séance par l'organisateur.
   */
  async cancelSession(
    sessionId: string,
    organizerUid: string,
    reason: string,
  ): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, sessionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    if (snap.data().organizer_uid !== organizerUid) throw new Error('Seul l\'organisateur peut annuler.');

    await updateDoc(ref, {
      is_cancelled: true,
      cancellation_reason: (reason || 'Annulé par l\'organisateur').trim(),
      updated_at: serverTimestamp(),
    });
  },

  async listUpcomingSessions(clubId: string, teamId?: string): Promise<PlayerExtraSession[]> {
    return this.listForClub(clubId);
  },
};
