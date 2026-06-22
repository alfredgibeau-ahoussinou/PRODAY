import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { playerActivityFromFirestore } from '../lib/firestoreMappers';
import type { CreatePlayerActivityInput, PlayerActivity } from '../models/PlayerActivity';
import type { TeamEvent } from '../models/TeamEvent';
import { buildActivityFromTeamEvent } from '../utils/teamEventActivitySync';

const COL = 'player_activities';

export const playerActivityService = {
  async listForPlayer(uid: string, max = 50): Promise<PlayerActivity[]> {
    if (!isFirebaseConfigured()) return [];

    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, COL),
        where('player_uid', '==', uid),
        orderBy('date', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        playerActivityFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch (error) {
      console.error('[playerActivityService] listForPlayer:', error);
      return [];
    }
  },

  /** Résumé staff — 5 dernières activités d'un joueur (règles Firestore staff). */
  async listForPlayerPublicSummary(uid: string, max = 5): Promise<PlayerActivity[]> {
    return this.listForPlayer(uid, max);
  },

  async findByTeamEvent(playerUid: string, teamEventId: string): Promise<PlayerActivity | null> {
    if (!isFirebaseConfigured()) return null;

    const database = getDb();
    if (!database) return null;

    try {
      const q = query(
        collection(database, COL),
        where('player_uid', '==', playerUid),
        where('team_event_id', '==', teamEventId),
        limit(1)
      );
      const snap = await getDocs(q);
      const first = snap.docs[0];
      if (!first) return null;
      return playerActivityFromFirestore(first.id, first.data() as Record<string, unknown>);
    } catch (error) {
      console.error('[playerActivityService] findByTeamEvent:', error);
      return null;
    }
  },

  async create(input: CreatePlayerActivityInput): Promise<string> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = doc(collection(database, COL));
    await setDoc(ref, activityPayload(input));
    return ref.id;
  },

  async upsertFromTeamEvent(input: CreatePlayerActivityInput): Promise<string | null> {
    if (!input.team_event_id) return null;
    if (!isFirebaseConfigured()) return null;

    const database = getDb();
    if (!database) return null;

    const existing = await this.findByTeamEvent(input.player_uid, input.team_event_id);
    if (existing) {
      await updateDoc(doc(database, COL, existing.id), activityPayload(input, { mergeCreatedAt: existing.created_at }));
      return existing.id;
    }

    const ref = doc(collection(database, COL));
    await setDoc(ref, activityPayload(input));
    return ref.id;
  },

  /** Synchronise les activités match depuis les événements équipe du joueur. */
  async syncFromTeamEvents(playerUid: string, events: TeamEvent[]): Promise<number> {
    let synced = 0;
    for (const event of events) {
      const input = buildActivityFromTeamEvent(event, playerUid);
      if (!input) continue;
      const id = await this.upsertFromTeamEvent(input);
      if (id) synced += 1;
    }
    return synced;
  },

  async delete(id: string, playerUid: string): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');

    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = doc(database, COL, id);
    const snap = await getDoc(ref);
    if (!snap.exists() || snap.data()?.player_uid !== playerUid) {
      throw new Error('Activité introuvable');
    }
    await deleteDoc(ref);
  },
};

function activityPayload(
  input: CreatePlayerActivityInput,
  options?: { mergeCreatedAt?: Date }
): Record<string, unknown> {
  const videoUrl = input.video_url?.trim() || null;
  const payload: Record<string, unknown> = {
    player_uid: input.player_uid,
    type: input.type,
    date: input.date,
    duration_min: input.duration_min,
    goals: input.goals ?? null,
    assists: input.assists ?? null,
    rating_self: input.rating_self ?? null,
    notes: input.notes?.trim() || null,
    video_url: videoUrl,
    performance_tags: input.performance_tags?.length ? input.performance_tags : null,
    source: input.source ?? 'manual',
    team_event_id: input.team_event_id ?? null,
    created_at: options?.mergeCreatedAt ?? serverTimestamp(),
  };
  if (videoUrl) {
    payload.analysis_status = 'pending_analysis';
  }
  return payload;
}
