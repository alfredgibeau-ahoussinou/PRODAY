import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  DEFAULT_PARENTAL_SETTINGS,
  type ParentalRuntime,
  type ParentalSettings,
} from '../models/ParentalSettings';
import { resolveDailyLimitMinutes } from './parentalScreenTimeLimits';

export { resolveDailyLimitMinutes } from './parentalScreenTimeLimits';

export const SCREEN_TIME_DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const;

export type ScreenTimeBlockReason = 'off_day' | 'limit_reached';

export function getScreenTimeDayKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function storageKey(uid: string): string {
  return `proday_screen_time:${uid}:${getScreenTimeDayKey()}`;
}

export function resolveRuntimeMinutesUsed(runtime?: ParentalRuntime): number {
  if (!runtime) return 0;
  if (runtime.date !== getScreenTimeDayKey()) return 0;
  return Math.max(0, runtime.minutes_used ?? 0);
}

async function syncRuntimeToFirestore(uid: string, minutes_used: number): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const database = getDb();
  if (!database) return;
  try {
    await updateDoc(doc(database, 'users', uid), {
      parental_runtime: {
        date: getScreenTimeDayKey(),
        minutes_used,
      },
      updated_at: serverTimestamp(),
    });
  } catch {
    // Hors-ligne ou règles — le suivi local reste actif.
  }
}

export function isScreenTimeActiveDay(activeDays: string[] | undefined): boolean {
  const days = activeDays?.length ? activeDays : DEFAULT_PARENTAL_SETTINGS.active_days;
  const label = SCREEN_TIME_DAY_LABELS[new Date().getDay()];
  return days.includes(label);
}

export async function getScreenTimeMinutesUsed(uid: string): Promise<number> {
  const raw = await AsyncStorage.getItem(storageKey(uid));
  if (!raw) return 0;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export async function recordScreenTimeMinute(uid: string): Promise<number> {
  const next = (await getScreenTimeMinutesUsed(uid)) + 1;
  await AsyncStorage.setItem(storageKey(uid), String(next));
  void syncRuntimeToFirestore(uid, next);
  return next;
}

export async function evaluateScreenTimeAccess(
  uid: string,
  settings: ParentalSettings,
): Promise<{
  blocked: boolean;
  minutesUsed: number;
  limitMinutes: number;
  reason?: ScreenTimeBlockReason;
}> {
  const limitMinutes = resolveDailyLimitMinutes(settings);
  if (!isScreenTimeActiveDay(settings.active_days)) {
    return { blocked: true, minutesUsed: 0, limitMinutes, reason: 'off_day' };
  }
  const minutesUsed = await getScreenTimeMinutesUsed(uid);
  if (minutesUsed >= limitMinutes) {
    return { blocked: true, minutesUsed, limitMinutes, reason: 'limit_reached' };
  }
  return { blocked: false, minutesUsed, limitMinutes };
}

export function shouldEnforceScreenTime(settings: ParentalSettings | undefined): boolean {
  return Boolean(settings?.screen_time_enabled);
}
