import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
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
  PlayerJournalEntry,
  CreatePlayerJournalInput,
} from '../models/PlayerJournal';

const COL = 'player_journal_entries';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function mapDoc(id: string, data: Record<string, unknown>): PlayerJournalEntry {
  return {
    id,
    player_uid: String(data.player_uid ?? ''),
    title: String(data.title ?? ''),
    content: String(data.content ?? ''),
    mood: data.mood as PlayerJournalEntry['mood'],
    energy_rating: typeof data.energy_rating === 'number' ? data.energy_rating : undefined,
    event_id: data.event_id ? String(data.event_id) : undefined,
    event_title: data.event_title ? String(data.event_title) : undefined,
    event_date: data.event_date ? toDate(data.event_date) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    is_shared: Boolean(data.is_shared),
    shared_with_coach_uid: data.shared_with_coach_uid ? String(data.shared_with_coach_uid) : undefined,
    shared_with_coach_name: data.shared_with_coach_name ? String(data.shared_with_coach_name) : undefined,
    shared_at: data.shared_at ? toDate(data.shared_at) : undefined,
    withdrawn_at: data.withdrawn_at ? toDate(data.withdrawn_at) : undefined,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export const playerJournalService = {
  /**
   * Crée une nouvelle entrée privée dans le journal.
   */
  async createEntry(input: CreatePlayerJournalInput): Promise<PlayerJournalEntry> {
    const database = getDb();
    const now = new Date();

    const payload: Record<string, unknown> = {
      player_uid: input.player_uid,
      title: input.title.trim(),
      content: input.content.trim(),
      mood: input.mood ?? null,
      energy_rating: input.energy_rating ?? null,
      event_id: input.event_id ?? null,
      event_title: input.event_title ?? null,
      event_date: input.event_date ? Timestamp.fromDate(input.event_date) : null,
      tags: input.tags ?? [],
      is_shared: false,
      shared_with_coach_uid: null,
      shared_with_coach_name: null,
      shared_at: null,
      withdrawn_at: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    let id = `jrn_${Date.now()}`;
    if (database && isFirebaseConfigured()) {
      const ref = await addDoc(collection(database, COL), payload);
      id = ref.id;
    }

    return {
      id,
      player_uid: input.player_uid,
      title: input.title.trim(),
      content: input.content.trim(),
      mood: input.mood,
      energy_rating: input.energy_rating,
      event_id: input.event_id,
      event_title: input.event_title,
      event_date: input.event_date,
      tags: input.tags ?? [],
      is_shared: false,
      created_at: now,
      updated_at: now,
    };
  },

  /**
   * Liste les entrées du journal d'un joueur (strictement restreint à player_uid).
   */
  async listForPlayer(playerUid: string, max = 50): Promise<PlayerJournalEntry[]> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !playerUid) return [];
    try {
      const q = query(
        collection(database, COL),
        where('player_uid', '==', playerUid),
        orderBy('created_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(collection(database, COL), where('player_uid', '==', playerUid), limit(max)),
      );
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  /**
   * Met à jour une entrée du journal.
   */
  async updateEntry(
    id: string,
    playerUid: string,
    patch: Partial<Pick<PlayerJournalEntry, 'title' | 'content' | 'mood' | 'energy_rating' | 'tags'>>,
  ): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    // Vérification de propriété
    if (snap.data().player_uid !== playerUid) throw new Error('Accès non autorisé.');

    const updatePayload: Record<string, unknown> = {
      updated_at: serverTimestamp(),
    };
    if (patch.title !== undefined) updatePayload.title = patch.title.trim();
    if (patch.content !== undefined) updatePayload.content = patch.content.trim();
    if (patch.mood !== undefined) updatePayload.mood = patch.mood;
    if (patch.energy_rating !== undefined) updatePayload.energy_rating = patch.energy_rating;
    if (patch.tags !== undefined) updatePayload.tags = patch.tags;

    await updateDoc(ref, updatePayload);
  },

  /**
   * Supprime une entrée du journal.
   */
  async deleteEntry(id: string, playerUid: string): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    if (snap.data().player_uid !== playerUid) throw new Error('Accès non autorisé.');
    await deleteDoc(ref);
  },

  /**
   * Partage délibéré d'une entrée avec un coach spécifique.
   */
  async shareWithCoach(
    id: string,
    playerUid: string,
    coachUid: string,
    coachName: string,
  ): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    if (snap.data().player_uid !== playerUid) throw new Error('Accès non autorisé.');

    await updateDoc(ref, {
      is_shared: true,
      shared_with_coach_uid: coachUid,
      shared_with_coach_name: coachName,
      shared_at: serverTimestamp(),
      withdrawn_at: null,
      updated_at: serverTimestamp(),
    });
  },

  /**
   * Retrait du partage vers le coach.
   */
  async withdrawShare(id: string, playerUid: string): Promise<void> {
    const database = getDb();
    if (!database || !isFirebaseConfigured()) return;
    const ref = doc(database, COL, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    if (snap.data().player_uid !== playerUid) throw new Error('Accès non autorisé.');

    await updateDoc(ref, {
      is_shared: false,
      withdrawn_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },

  async withdrawSharing(id: string, playerUid: string): Promise<void> {
    return this.withdrawShare(id, playerUid);
  },

  async listPlayerEntries(playerUid: string, max = 50): Promise<PlayerJournalEntry[]> {
    return this.listForPlayer(playerUid, max);
  },

  /**
   * Liste les entrées partagées par des joueurs reçues par un coach.
   */
  async listSharedWithCoach(coachUid: string, max = 30): Promise<PlayerJournalEntry[]> {
    const database = getDb();
    if (!database || !isFirebaseConfigured() || !coachUid) return [];
    try {
      const q = query(
        collection(database, COL),
        where('shared_with_coach_uid', '==', coachUid),
        where('is_shared', '==', true),
        orderBy('shared_at', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('shared_with_coach_uid', '==', coachUid),
          limit(max),
        ),
      );
      return snap.docs
        .map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
        .filter((entry) => entry.is_shared)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },
};
