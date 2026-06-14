import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'proday:reel-bookmarks';

export async function loadReelBookmarks(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw) as string[];
    const stable = (Array.isArray(ids) ? ids : []).filter((id) => !/^reel-\d+$/.test(id));
    return new Set(stable);
  } catch {
    return new Set();
  }
}

export async function toggleReelBookmark(reelId: string): Promise<boolean> {
  const set = await loadReelBookmarks();
  const next = set.has(reelId);
  if (next) set.delete(reelId);
  else set.add(reelId);
  await AsyncStorage.setItem(KEY, JSON.stringify([...set]));
  return !next;
}

export async function isReelBookmarked(reelId: string): Promise<boolean> {
  const set = await loadReelBookmarks();
  return set.has(reelId);
}
