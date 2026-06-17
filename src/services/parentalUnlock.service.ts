import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { ParentalSettings, ParentalUnlockRequest } from '../models/ParentalSettings';
import { DEFAULT_PARENTAL_SETTINGS } from '../models/ParentalSettings';
import { getScreenTimeDayKey } from '../utils/parentalScreenTime';

const UNLOCK_MINUTES = 15;

export const parentalUnlockService = {
  buildClearUnlockRequest(
    settings: ParentalSettings,
    status: 'approved' | 'denied',
    grantBonus: boolean,
  ): ParentalSettings {
    const unlock_request = settings.unlock_request
      ? { ...settings.unlock_request, status }
      : undefined;
    return {
      ...settings,
      unlock_request,
      ...(grantBonus
        ? {
            screen_time_bonus_minutes: UNLOCK_MINUTES,
            screen_time_bonus_day: getScreenTimeDayKey(),
          }
        : {}),
    };
  },

  async requestUnlock(uid: string, currentSettings?: ParentalSettings): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const settings: ParentalSettings = {
      ...DEFAULT_PARENTAL_SETTINGS,
      ...currentSettings,
    };
    const existing = settings.unlock_request;
    if (existing?.status === 'pending') {
      throw new Error('Une demande est déjà en attente auprès de votre tuteur.');
    }

    const unlock_request: ParentalUnlockRequest = {
      requested_at: new Date().toISOString(),
      minutes: UNLOCK_MINUTES,
      status: 'pending',
    };

    await updateDoc(doc(database, 'users', uid), {
      parental_settings: { ...settings, unlock_request },
      updated_at: serverTimestamp(),
    });
  },
};
