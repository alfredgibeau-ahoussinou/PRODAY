import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlaybackReel } from '../content/footballReels';

const KEY = 'proday:reel-follows';

/** Clé stable pour un auteur — indépendante de l'id de session du reel. */
export function reelAuthorKey(reel: Pick<PlaybackReel, 'authorHandle' | 'authorName'>): string {
  const handle = reel.authorHandle?.trim();
  if (handle) return `@${handle.toLowerCase()}`;
  return (reel.authorName?.trim() || 'proday').toLowerCase();
}

export async function loadReelFollows(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return new Set();
    const keys = JSON.parse(raw) as string[];
    return new Set(Array.isArray(keys) ? keys : []);
  } catch {
    return new Set();
  }
}

export async function toggleReelFollow(authorKey: string): Promise<boolean> {
  const set = await loadReelFollows();
  const following = set.has(authorKey);
  if (following) set.delete(authorKey);
  else set.add(authorKey);
  await AsyncStorage.setItem(KEY, JSON.stringify([...set]));
  return !following;
}

export async function isFollowingAuthor(authorKey: string): Promise<boolean> {
  const set = await loadReelFollows();
  return set.has(authorKey);
}
