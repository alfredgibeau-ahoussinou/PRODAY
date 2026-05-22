import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  messageThreadFromFirestore,
  chatMessageFromFirestore,
  type MessageThread,
  type ChatMessage,
} from '../lib/firestoreMappers';

function threadIdFor(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('__');
}

export const messagesService = {
  async listThreads(currentUid: string, max = 40): Promise<MessageThread[]> {
    if (!isFirebaseConfigured() || !currentUid) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'message_threads'),
        where('participant_ids', 'array-contains', currentUid),
        orderBy('updated_at', 'desc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        messageThreadFromFirestore(
          d.id,
          d.data() as Record<string, unknown>,
          currentUid
        )
      );
    } catch (error) {
      console.error('[messagesService] listThreads:', error);
      return [];
    }
  },

  async getOrCreateThread(
    currentUid: string,
    currentName: string,
    otherUid: string,
    otherName: string
  ): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    if (currentUid === otherUid) throw new Error('Impossible de vous contacter vous-même.');

    const id = threadIdFor(currentUid, otherUid);
    const ref = doc(database, 'message_threads', id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        participant_ids: [currentUid, otherUid],
        participant_names: {
          [currentUid]: currentName,
          [otherUid]: otherName,
        },
        last_message: '',
        updated_at: serverTimestamp(),
        unread_by: [],
      });
    } else {
      const names = (snap.data().participant_names ?? {}) as Record<string, string>;
      await updateDoc(ref, {
        participant_names: {
          ...names,
          [currentUid]: currentName,
          [otherUid]: otherName,
        },
        updated_at: serverTimestamp(),
      });
    }

    return id;
  },

  async listMessages(threadId: string, max = 80): Promise<ChatMessage[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, 'messages'),
        where('thread_id', '==', threadId),
        orderBy('created_at', 'asc'),
        limit(max)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        chatMessageFromFirestore(d.id, d.data() as Record<string, unknown>)
      );
    } catch (error) {
      console.error('[messagesService] listMessages:', error);
      return [];
    }
  },

  async sendMessage(
    threadId: string,
    senderUid: string,
    receiverUid: string,
    body: string
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const text = body.trim();
    if (!text) throw new Error('Message vide.');

    await addDoc(collection(database, 'messages'), {
      thread_id: threadId,
      sender_id: senderUid,
      receiver_id: receiverUid,
      body: text,
      created_at: serverTimestamp(),
    });

    await updateDoc(doc(database, 'message_threads', threadId), {
      last_message: text,
      updated_at: serverTimestamp(),
      unread_by: arrayUnion(receiverUid),
    });
  },

  async markThreadRead(threadId: string, uid: string): Promise<void> {
    const database = getDb();
    if (!database) return;
    await updateDoc(doc(database, 'message_threads', threadId), {
      unread_by: arrayRemove(uid),
    });
  },

  getOtherParticipantId(threadId: string, currentUid: string): string | null {
    const parts = threadId.split('__');
    if (parts.length !== 2) return null;
    return parts[0] === currentUid ? parts[1] : parts[0];
  },

  subscribeThreads(
    currentUid: string,
    onUpdate: (threads: MessageThread[]) => void,
    max = 40
  ): Unsubscribe | null {
    if (!isFirebaseConfigured() || !currentUid) return null;
    const database = getDb();
    if (!database) return null;

    const q = query(
      collection(database, 'message_threads'),
      where('participant_ids', 'array-contains', currentUid),
      orderBy('updated_at', 'desc'),
      limit(max)
    );

    return onSnapshot(
      q,
      (snap) => {
        const threads = snap.docs.map((d) =>
          messageThreadFromFirestore(
            d.id,
            d.data() as Record<string, unknown>,
            currentUid
          )
        );
        onUpdate(threads);
      },
      (error) => console.error('[messagesService] subscribeThreads:', error)
    );
  },

  subscribeMessages(
    threadId: string,
    onUpdate: (messages: ChatMessage[]) => void,
    max = 80
  ): Unsubscribe | null {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;

    const q = query(
      collection(database, 'messages'),
      where('thread_id', '==', threadId),
      orderBy('created_at', 'asc'),
      limit(max)
    );

    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) =>
          chatMessageFromFirestore(d.id, d.data() as Record<string, unknown>)
        );
        onUpdate(list);
      },
      (error) => console.error('[messagesService] subscribeMessages:', error)
    );
  },
};
