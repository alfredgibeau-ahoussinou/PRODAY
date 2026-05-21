import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import { messageThreadFromFirestore, type MessageThread } from '../lib/firestoreMappers';

export const messagesService = {
  async listThreads(max = 30): Promise<MessageThread[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'message_threads'),
        orderBy('updated_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        messageThreadFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch {
      return [];
    }
  },
};
