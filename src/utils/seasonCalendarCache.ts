import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SeasonCalendarItem } from './seasonCalendar';

const KEY_PREFIX = 'proday:season-calendar:';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type CachedPayload = {
  items: Array<Omit<SeasonCalendarItem, 'starts_at'> & { starts_at: string }>;
  cachedAt: string;
};

function reviveItem(raw: CachedPayload['items'][number]): SeasonCalendarItem {
  return {
    ...raw,
    starts_at: new Date(raw.starts_at),
  };
}

export async function loadSeasonCalendarCache(uid: string): Promise<SeasonCalendarItem[] | null> {
  try {
    const raw = await AsyncStorage.getItem(`${KEY_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    if (!parsed.cachedAt || !Array.isArray(parsed.items)) return null;
    if (Date.now() - new Date(parsed.cachedAt).getTime() > MAX_AGE_MS) return null;
    return parsed.items.map(reviveItem);
  } catch {
    return null;
  }
}

export async function saveSeasonCalendarCache(
  uid: string,
  items: SeasonCalendarItem[]
): Promise<void> {
  try {
    const payload: CachedPayload = {
      cachedAt: new Date().toISOString(),
      items: items.map((item) => ({
        ...item,
        starts_at: item.starts_at.toISOString(),
      })),
    };
    await AsyncStorage.setItem(`${KEY_PREFIX}${uid}`, JSON.stringify(payload));
  } catch {
    /* cache best-effort */
  }
}
