import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

export const DEFAULT_WEEKLY_SESSIONS_TARGET = 3;

const storageKey = (uid: string) => `v3_career_prefs_${uid}`;

export const careerPreferencesService = {
  async getWeeklySessionsTarget(uid: string): Promise<number> {
    if (isFirebaseConfigured()) {
      const database = getDb();
      if (database) {
        try {
          const snap = await getDoc(doc(database, 'users', uid, 'v3_prefs', 'career'));
          const raw = snap.data()?.weekly_sessions_target;
          if (typeof raw === 'number' && raw > 0) return raw;
        } catch {
          /* fallback local */
        }
      }
    }

    const raw = await AsyncStorage.getItem(storageKey(uid));
    if (!raw) return DEFAULT_WEEKLY_SESSIONS_TARGET;
    try {
      const parsed = JSON.parse(raw) as { weekly_sessions_target?: number };
      const target = parsed.weekly_sessions_target;
      return typeof target === 'number' && target > 0 ? target : DEFAULT_WEEKLY_SESSIONS_TARGET;
    } catch {
      return DEFAULT_WEEKLY_SESSIONS_TARGET;
    }
  },

  async setWeeklySessionsTarget(uid: string, target: number): Promise<void> {
    const value = Math.max(1, Math.round(target));

    if (isFirebaseConfigured()) {
      const database = getDb();
      if (database) {
        try {
          await setDoc(
            doc(database, 'users', uid, 'v3_prefs', 'career'),
            { weekly_sessions_target: value, updated_at: serverTimestamp() },
            { merge: true }
          );
        } catch {
          /* fallback local */
        }
      }
    }

    await AsyncStorage.setItem(storageKey(uid), JSON.stringify({ weekly_sessions_target: value }));
  },

  async getWeeklyFocus(uid: string): Promise<string | null> {
    if (isFirebaseConfigured()) {
      const database = getDb();
      if (database) {
        try {
          const snap = await getDoc(doc(database, 'users', uid, 'v3_prefs', 'career'));
          const raw = snap.data()?.weekly_focus;
          if (typeof raw === 'string' && raw.trim()) return raw.trim();
        } catch {
          /* fallback local */
        }
      }
    }
    const raw = await AsyncStorage.getItem(`${storageKey(uid)}_focus`);
    return raw?.trim() || null;
  },

  async setWeeklyFocus(uid: string, focus: string): Promise<void> {
    const value = focus.trim().slice(0, 200);
    if (!value) return;

    if (isFirebaseConfigured()) {
      const database = getDb();
      if (database) {
        try {
          await setDoc(
            doc(database, 'users', uid, 'v3_prefs', 'career'),
            { weekly_focus: value, updated_at: serverTimestamp() },
            { merge: true },
          );
        } catch {
          /* fallback local */
        }
      }
    }

    await AsyncStorage.setItem(`${storageKey(uid)}_focus`, value);
  },
};
