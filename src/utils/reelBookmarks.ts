import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'proday:reel-bookmarks-v2';
const LEGACY_KEY = 'proday:reel-bookmarks';

export interface ReelBookmarkEntry {
  bookmarkKey: string;
  authorName: string;
  caption: string;
  sourceUrl: string;
  savedAt: string;
}

async function readEntries(): Promise<ReelBookmarkEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ReelBookmarkEntry[];
      return Array.isArray(parsed) ? parsed : [];
    }
    const legacy = await AsyncStorage.getItem(LEGACY_KEY);
    if (!legacy) return [];
    const ids = JSON.parse(legacy) as string[];
    return (Array.isArray(ids) ? ids : [])
      .filter((id) => !/^reel-\d+$/.test(id))
      .map((bookmarkKey) => ({
        bookmarkKey,
        authorName: 'Reel sauvegardé',
        caption: '',
        sourceUrl: '',
        savedAt: new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

export async function loadReelBookmarks(): Promise<Set<string>> {
  const entries = await readEntries();
  return new Set(entries.map((e) => e.bookmarkKey));
}

export async function loadReelBookmarkEntries(): Promise<ReelBookmarkEntry[]> {
  return readEntries();
}

export async function toggleReelBookmark(
  bookmarkKey: string,
  meta?: Pick<ReelBookmarkEntry, 'authorName' | 'caption' | 'sourceUrl'>,
): Promise<boolean> {
  const entries = await readEntries();
  const idx = entries.findIndex((e) => e.bookmarkKey === bookmarkKey);
  if (idx >= 0) {
    entries.splice(idx, 1);
    await AsyncStorage.setItem(KEY, JSON.stringify(entries));
    return false;
  }
  entries.unshift({
    bookmarkKey,
    authorName: meta?.authorName ?? 'Reel',
    caption: meta?.caption ?? '',
    sourceUrl: meta?.sourceUrl ?? '',
    savedAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(KEY, JSON.stringify(entries.slice(0, 80)));
  return true;
}

export async function isReelBookmarked(reelId: string): Promise<boolean> {
  const set = await loadReelBookmarks();
  return set.has(reelId);
}
