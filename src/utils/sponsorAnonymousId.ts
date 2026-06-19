import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'proday:sponsor_anonymous_id';

function randomId(): string {
  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

/** Identifiant persistant pour le tracking sponsor des visiteurs non connectés. */
export async function getSponsorAnonymousId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (existing?.trim()) return existing.trim();
    const next = randomId();
    await AsyncStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return randomId();
  }
}
