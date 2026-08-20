import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';

const STORAGE_KEY = 'proday_supporter_filters_v1';
const NOTIF_STORAGE_KEY = 'proday_supporter_notif_v1';

export type SupporterGenderFilter = 'all' | 'men' | 'women' | 'mixed';
export type SupporterSourceFilter = 'all' | 'proday' | 'world';
export type SupporterScopeFilter = 'all' | 'follows';
export type SupporterCompetitionFilter = 'all' | 'ligue1' | 'pl' | 'laliga' | 'd1f';

export interface SupporterMatchFilters {
  gender: SupporterGenderFilter;
  source: SupporterSourceFilter;
  scope: SupporterScopeFilter;
  competition: SupporterCompetitionFilter;
}

export interface SupporterNotificationPreferences {
  goalAlerts: boolean;
  kickoffAlerts: boolean;
  matchReminders: boolean;
  communityDigest: boolean;
  summaryAlerts: boolean;
}

export const DEFAULT_SUPPORTER_MATCH_FILTERS: SupporterMatchFilters = {
  gender: 'all',
  source: 'all',
  scope: 'all',
  competition: 'all',
};

export const DEFAULT_SUPPORTER_NOTIF_PREFS: SupporterNotificationPreferences = {
  goalAlerts: true,
  kickoffAlerts: true,
  matchReminders: true,
  communityDigest: false,
  summaryAlerts: true,
};

export async function loadSupporterMatchFilters(
  uid: string
): Promise<SupporterMatchFilters> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY}:${uid}`);
    if (!raw) return { ...DEFAULT_SUPPORTER_MATCH_FILTERS };
    return { ...DEFAULT_SUPPORTER_MATCH_FILTERS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SUPPORTER_MATCH_FILTERS };
  }
}

export async function saveSupporterMatchFilters(
  uid: string,
  filters: SupporterMatchFilters
): Promise<void> {
  await AsyncStorage.setItem(`${STORAGE_KEY}:${uid}`, JSON.stringify(filters));
}

export async function loadSupporterNotificationPrefs(
  uid: string
): Promise<SupporterNotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(`${NOTIF_STORAGE_KEY}:${uid}`);
    if (!raw) return { ...DEFAULT_SUPPORTER_NOTIF_PREFS };
    return { ...DEFAULT_SUPPORTER_NOTIF_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SUPPORTER_NOTIF_PREFS };
  }
}

export async function syncSupporterNotificationPrefsToFirestore(
  uid: string,
  prefs: SupporterNotificationPreferences
): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await updateDoc(doc(database, 'users', uid), {
      'notification_preferences.supporter': prefs,
      updated_at: serverTimestamp(),
    });
  } catch (e) {
    console.warn('[supporterPrefs] Firestore sync skipped:', e);
  }
}

export async function saveSupporterNotificationPrefs(
  uid: string,
  prefs: SupporterNotificationPreferences
): Promise<void> {
  await AsyncStorage.setItem(`${NOTIF_STORAGE_KEY}:${uid}`, JSON.stringify(prefs));
  await syncSupporterNotificationPrefsToFirestore(uid, prefs);
}
