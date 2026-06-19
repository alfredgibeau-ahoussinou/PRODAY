import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

export type WeeklyReactionKind = 'like' | 'fire' | 'clap';

const VALID: WeeklyReactionKind[] = ['like', 'fire', 'clap'];

export const weeklyQuestionReactionsService = {
  async getCounts(
    questionId: string,
    responseUid: string,
  ): Promise<Record<WeeklyReactionKind, number>> {
    const empty = { like: 0, fire: 0, clap: 0 };
    if (!isFirebaseConfigured()) return empty;
    const database = getDb();
    if (!database) return empty;
    const snap = await getDoc(
      doc(database, 'weekly_questions', questionId, 'responses', responseUid),
    );
    if (!snap.exists()) return empty;
    const reactions = snap.data().reactions as Record<string, string> | undefined;
    if (!reactions) return empty;
    const counts = { ...empty };
    for (const kind of Object.values(reactions)) {
      if (VALID.includes(kind as WeeklyReactionKind)) {
        counts[kind as WeeklyReactionKind] += 1;
      }
    }
    return counts;
  },

  async getMyReaction(
    questionId: string,
    responseUid: string,
    viewerUid: string,
  ): Promise<WeeklyReactionKind | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(
      doc(database, 'weekly_questions', questionId, 'responses', responseUid),
    );
    if (!snap.exists()) return null;
    const reactions = snap.data().reactions as Record<string, string> | undefined;
    const mine = reactions?.[viewerUid];
    return VALID.includes(mine as WeeklyReactionKind) ? (mine as WeeklyReactionKind) : null;
  },

  async toggle(
    questionId: string,
    responseUid: string,
    viewerUid: string,
    kind: WeeklyReactionKind,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const ref = doc(database, 'weekly_questions', questionId, 'responses', responseUid);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Réponse introuvable');
    const reactions = { ...(snap.data().reactions as Record<string, string> | undefined) };
    if (reactions[viewerUid] === kind) {
      delete reactions[viewerUid];
    } else {
      reactions[viewerUid] = kind;
    }
    await setDoc(ref, { reactions, updated_at: serverTimestamp() }, { merge: true });
  },

  async clear(questionId: string, responseUid: string, viewerUid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const ref = doc(database, 'weekly_questions', questionId, 'responses', responseUid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const reactions = { ...(snap.data().reactions as Record<string, string> | undefined) };
    delete reactions[viewerUid];
    await setDoc(ref, { reactions, updated_at: serverTimestamp() }, { merge: true });
  },
};
