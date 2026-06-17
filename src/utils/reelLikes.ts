import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'proday:reel-likes';

export async function loadReelLikes(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw) as string[];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

export async function toggleReelLike(bookmarkKey: string): Promise<boolean> {
  const set = await loadReelLikes();
  const liked = set.has(bookmarkKey);
  if (liked) set.delete(bookmarkKey);
  else set.add(bookmarkKey);
  await AsyncStorage.setItem(KEY, JSON.stringify([...set]));
  return !liked;
}

export async function isReelLiked(bookmarkKey: string): Promise<boolean> {
  const set = await loadReelLikes();
  return set.has(bookmarkKey);
}
