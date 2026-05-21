import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { recruitmentPostFromFirestore } from '../lib/firestoreMappers';
import type { RecruitmentPost } from '../models/Player';

export const recruitmentService = {
  async listOpenPosts(max = 10): Promise<RecruitmentPost[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'recruitment_posts'),
        where('status', '==', 'OPEN'),
        orderBy('created_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        recruitmentPostFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch (error) {
      console.error('[recruitmentService] listOpenPosts:', error);
      return [];
    }
  },

  async createPost(input: {
    club_id: string;
    club_name: string;
    title: string;
    position: string;
    category: string;
    level: string;
    city: string;
    description?: string;
  }): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = await addDoc(collection(database, 'recruitment_posts'), {
      ...input,
      status: 'OPEN',
      created_at: serverTimestamp(),
    });
    return ref.id;
  },
};

/** Temps relatif depuis created_at */
export function formatTimeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 3600) return `Il y a ${Math.max(1, Math.floor(sec / 60))} min`;
  if (sec < 86400) return `Il y a ${Math.floor(sec / 3600)} h`;
  const days = Math.floor(sec / 86400);
  if (days === 1) return 'Il y a 1 j';
  return `Il y a ${days} j`;
}
