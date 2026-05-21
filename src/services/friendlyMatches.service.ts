import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { friendlyMatchFromFirestore } from '../lib/firestoreMappers';
import type { FriendlyMatch, CreateFriendlyMatchInput } from '../models/FriendlyMatch';

export const friendlyMatchesService = {
  async listUpcoming(max = 30): Promise<FriendlyMatch[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'friendly_matches'),
        orderBy('date', 'asc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        friendlyMatchFromFirestore(d.id, d.data() as Record<string, unknown>)
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

  async create(input: CreateFriendlyMatchInput): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = await addDoc(collection(database, 'friendly_matches'), {
      requester_club_id: input.requester_club_id,
      requester_club_name: input.requester_club_name,
      opponent_club_name: input.opponent_club_name ?? null,
      city: input.city,
      date: Timestamp.fromDate(input.date),
      time_label: input.time_label,
      category: input.category,
      level: input.level,
      level_type: input.level_type,
      has_pitch: true,
      message: input.message ?? '',
      status: 'OPEN',
      created_at: serverTimestamp(),
    });
    return ref.id;
  },
};
