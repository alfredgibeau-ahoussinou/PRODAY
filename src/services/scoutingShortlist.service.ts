import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

export type ShortlistEntry = {
  player_uid: string;
  club_id: string;
  staff_uid: string;
  notes: string;
  scouting_score?: number;
  created_at: Date;
  updated_at: Date;
};

function col(clubId: string) {
  return collection(getDb()!, 'club_shortlists', clubId, 'players');
}

export const scoutingShortlistService = {
  async getEntry(clubId: string, playerUid: string): Promise<ShortlistEntry | null> {
    if (!isFirebaseConfigured() || !clubId) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, 'club_shortlists', clubId, 'players', playerUid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      player_uid: playerUid,
      club_id: clubId,
      staff_uid: String(d.staff_uid ?? ''),
      notes: String(d.notes ?? ''),
      scouting_score: typeof d.scouting_score === 'number' ? d.scouting_score : undefined,
      created_at: d.created_at?.toDate?.() ?? new Date(),
      updated_at: d.updated_at?.toDate?.() ?? new Date(),
    };
  },

  async listByClub(clubId: string): Promise<ShortlistEntry[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(query(col(clubId), orderBy('updated_at', 'desc')));
      return snap.docs.map((s) => {
        const d = s.data();
        return {
          player_uid: s.id,
          club_id: clubId,
          staff_uid: String(d.staff_uid ?? ''),
          notes: String(d.notes ?? ''),
          scouting_score: typeof d.scouting_score === 'number' ? d.scouting_score : undefined,
          created_at: d.created_at?.toDate?.() ?? new Date(),
          updated_at: d.updated_at?.toDate?.() ?? new Date(),
        };
      });
    } catch {
      return [];
    }
  },

  async upsert(
    clubId: string,
    playerUid: string,
    staffUid: string,
    patch: { notes?: string; scouting_score?: number },
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await setDoc(
      doc(database, 'club_shortlists', clubId, 'players', playerUid),
      {
        club_id: clubId,
        staff_uid: staffUid,
        notes: patch.notes ?? '',
        scouting_score: patch.scouting_score ?? null,
        updated_at: serverTimestamp(),
        created_at: serverTimestamp(),
      },
      { merge: true },
    );
  },

  async remove(clubId: string, playerUid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, 'club_shortlists', clubId, 'players', playerUid));
  },
};
