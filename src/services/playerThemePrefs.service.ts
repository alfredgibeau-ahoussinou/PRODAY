import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  DEFAULT_PLAYER_THEME_PREFS,
  type PlayerThemePrefs,
} from '../models/PlayerThemePrefs';
import { sanitizePlayerThemePrefs } from '../utils/resolvePlayerThemeColors';

const storageKey = (uid: string) => `v3_player_theme_prefs_${uid}`;

export const playerThemePrefsService = {
  async get(uid: string): Promise<PlayerThemePrefs> {
    if (isFirebaseConfigured()) {
      const database = getDb();
      if (database) {
        try {
          const snap = await getDoc(doc(database, 'users', uid, 'v3_prefs', 'theme'));
          if (snap.exists()) {
            return sanitizePlayerThemePrefs(snap.data());
          }
        } catch {
          /* fallback local */
        }
      }
    }

    const raw = await AsyncStorage.getItem(storageKey(uid));
    if (!raw) return DEFAULT_PLAYER_THEME_PREFS;
    try {
      return sanitizePlayerThemePrefs(JSON.parse(raw));
    } catch {
      return DEFAULT_PLAYER_THEME_PREFS;
    }
  },

  async set(uid: string, prefs: PlayerThemePrefs): Promise<void> {
    const sanitized = sanitizePlayerThemePrefs(prefs);

    if (isFirebaseConfigured()) {
      const database = getDb();
      if (database) {
        try {
          await setDoc(
            doc(database, 'users', uid, 'v3_prefs', 'theme'),
            { ...sanitized, updated_at: serverTimestamp() },
            { merge: true },
          );
        } catch {
          /* fallback local */
        }
      }
    }

    await AsyncStorage.setItem(storageKey(uid), JSON.stringify(sanitized));
  },
};
