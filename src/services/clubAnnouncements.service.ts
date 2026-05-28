import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { clubAnnouncementFromFirestore } from '../lib/firestoreMappers';
import type {
  ClubAnnouncement,
  CreateClubAnnouncementInput,
} from '../models/ClubAnnouncement';

const COL = 'club_announcements';

export const clubAnnouncementsService = {
  async listByClub(clubId: string, max = 50): Promise<ClubAnnouncement[]> {
    if (!isFirebaseConfigured() || !clubId) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, COL),
        where('club_id', '==', clubId),
        orderBy('created_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        clubAnnouncementFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch {
      const q = query(collection(database, COL), where('club_id', '==', clubId), limit(max));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => clubAnnouncementFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  async create(input: CreateClubAnnouncementInput): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = await addDoc(collection(database, COL), {
      club_id: input.club_id,
      author_uid: input.author_uid,
      author_name: input.author_name.trim(),
      title: input.title.trim(),
      body: input.body.trim(),
      created_at: serverTimestamp(),
    });
    return ref.id;
  },

  async delete(announcementId: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await deleteDoc(doc(database, COL, announcementId));
  },
};
