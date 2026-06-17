import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

const KEY_PREFIX = 'proday:network-dismissed';

function storageKey(uid: string): string {
  return `${KEY_PREFIX}:${uid}`;
}

function firestoreRef(uid: string) {
  const database = getDb();
  if (!database) return null;
  return doc(database, 'users', uid, 'v3_prefs', 'network');
}

/** Suggestions masquées via « Pas pour le moment » — Firestore + cache local. */
export const networkSuggestionsService = {
  async loadDismissedIds(uid: string): Promise<Set<string>> {
    if (!uid) return new Set();

    if (isFirebaseConfigured()) {
      try {
        const ref = firestoreRef(uid);
        if (ref) {
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const ids = snap.data().dismissed_ids as string[] | undefined;
            const set = new Set(Array.isArray(ids) ? ids : []);
            await AsyncStorage.setItem(storageKey(uid), JSON.stringify([...set]));
            return set;
          }
        }
      } catch {
        /* fallback local */
      }
    }

    try {
      const raw = await AsyncStorage.getItem(storageKey(uid));
      if (!raw) return new Set();
      const ids = JSON.parse(raw) as string[];
      return new Set(Array.isArray(ids) ? ids : []);
    } catch {
      return new Set();
    }
  },

  async dismiss(uid: string, suggestionId: string): Promise<Set<string>> {
    const current = await this.loadDismissedIds(uid);
    current.add(suggestionId);
    const list = [...current];

    await AsyncStorage.setItem(storageKey(uid), JSON.stringify(list));

    if (isFirebaseConfigured()) {
      try {
        const ref = firestoreRef(uid);
        if (ref) {
          await setDoc(
            ref,
            {
              dismissed_ids: list,
              updated_at: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch {
        /* cache local suffit */
      }
    }

    return current;
  },

  async reset(uid: string): Promise<void> {
    await AsyncStorage.removeItem(storageKey(uid));
    if (isFirebaseConfigured()) {
      try {
        const ref = firestoreRef(uid);
        if (ref) {
          await setDoc(
            ref,
            {
              dismissed_ids: [],
              updated_at: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch {
        /* ignore */
      }
    }
  },
};
