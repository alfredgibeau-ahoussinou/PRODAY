import AsyncStorage from '@react-native-async-storage/async-storage';

const CALENDAR_SYNC_KEY = 'proday_v3_calendar_sync_v1';
const WELCOME_DISMISSED_KEY = 'proday_v3_welcome_dismissed_v1';
const CALENDAR_LAST_SYNC_KEY = 'proday_v3_calendar_last_sync_v1';

export async function isCalendarSyncEnabled(uid: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(`${CALENDAR_SYNC_KEY}:${uid}`);
    if (raw == null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}

export async function setCalendarSyncEnabled(uid: string, enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(`${CALENDAR_SYNC_KEY}:${uid}`, enabled ? '1' : '0');
}

export async function isV3WelcomeDismissed(uid: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(`${WELCOME_DISMISSED_KEY}:${uid}`);
    return raw === '1';
  } catch {
    return false;
  }
}

export async function dismissV3Welcome(uid: string): Promise<void> {
  await AsyncStorage.setItem(`${WELCOME_DISMISSED_KEY}:${uid}`, '1');
}

export async function getLastCalendarSyncAt(uid: string): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CALENDAR_LAST_SYNC_KEY}:${uid}`);
    if (!raw) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

export async function setLastCalendarSyncAt(uid: string, timestampMs: number): Promise<void> {
  await AsyncStorage.setItem(`${CALENDAR_LAST_SYNC_KEY}:${uid}`, String(timestampMs));
}
