import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { HealthProgramId } from '../features/v3/engines/healthProgram.engine';

const storageKey = (uid: string, programId: string) => `v3_health_prog_${uid}_${programId}`;

export const healthProgramPreferencesService = {
  async getCompletedDays(uid: string, programId: HealthProgramId): Promise<number[]> {
    if (isFirebaseConfigured()) {
      const database = getDb();
      if (database) {
        try {
          const snap = await getDoc(doc(database, 'users', uid, 'health_program_progress', programId));
          if (snap.exists()) {
            const days = snap.data()?.completed_days;
            if (Array.isArray(days)) return days.filter((d) => typeof d === 'number');
          }
        } catch {
          /* fallback local */
        }
      }
    }

    const raw = await AsyncStorage.getItem(storageKey(uid, programId));
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as number[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  async setCompletedDays(uid: string, programId: HealthProgramId, days: number[]): Promise<void> {
    const sorted = [...days].sort((a, b) => a - b);

    if (isFirebaseConfigured()) {
      const database = getDb();
      if (database) {
        try {
          await setDoc(
            doc(database, 'users', uid, 'health_program_progress', programId),
            { completed_days: sorted, updated_at: serverTimestamp() },
            { merge: true }
          );
        } catch {
          /* fallback local */
        }
      }
    }

    await AsyncStorage.setItem(storageKey(uid, programId), JSON.stringify(sorted));
  },
};
