import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'proday:reel-comments-v1';
const MAX_PER_REEL = 60;

export interface ReelComment {
  id: string;
  bookmarkKey: string;
  authorName: string;
  authorUid?: string;
  text: string;
  at: string;
}

type CommentStore = Record<string, ReelComment[]>;

async function readStore(): Promise<CommentStore> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CommentStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: CommentStore): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(store));
}

/** Nombre de commentaires par reel — pour alimenter le compteur du rail. */
export async function loadReelCommentCounts(): Promise<Record<string, number>> {
  const store = await readStore();
  const counts: Record<string, number> = {};
  for (const [key, list] of Object.entries(store)) {
    counts[key] = Array.isArray(list) ? list.length : 0;
  }
  return counts;
}

export async function loadReelComments(bookmarkKey: string): Promise<ReelComment[]> {
  const store = await readStore();
  const list = store[bookmarkKey];
  return Array.isArray(list) ? list : [];
}

export async function addReelComment(
  bookmarkKey: string,
  input: { text: string; authorName: string; authorUid?: string },
): Promise<ReelComment[]> {
  const text = input.text.trim();
  if (!text) return loadReelComments(bookmarkKey);
  const store = await readStore();
  const list = Array.isArray(store[bookmarkKey]) ? store[bookmarkKey] : [];
  const comment: ReelComment = {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    bookmarkKey,
    authorName: input.authorName || 'Toi',
    authorUid: input.authorUid,
    text,
    at: new Date().toISOString(),
  };
  store[bookmarkKey] = [comment, ...list].slice(0, MAX_PER_REEL);
  await writeStore(store);
  return store[bookmarkKey];
}

export async function removeReelComment(
  bookmarkKey: string,
  commentId: string,
): Promise<ReelComment[]> {
  const store = await readStore();
  const list = Array.isArray(store[bookmarkKey]) ? store[bookmarkKey] : [];
  store[bookmarkKey] = list.filter((c) => c.id !== commentId);
  await writeStore(store);
  return store[bookmarkKey];
}
