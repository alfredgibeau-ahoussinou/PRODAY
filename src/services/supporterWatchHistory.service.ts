import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

const STORAGE_PREFIX = 'proday_supporter_watch_v1';
const COL = 'supporter_watch_history';
const SAVED_COL = 'supporter_saved_matches';

export type SupporterWatchSource = 'proday' | 'world' | 'community';

export interface SupporterWatchEntry {
  matchId: string;
  source: SupporterWatchSource;
  watchedAt: Date;
  progressMs?: number;
  title: string;
  teams: string;
}

export interface SupporterWatchStats {
  watched: number;
  saved: number;
  followed: number;
}

function storageKey(uid: string): string {
  return `${STORAGE_PREFIX}:${uid}`;
}

function fromFirestore(data: Record<string, unknown>): SupporterWatchEntry {
  const watchedAtRaw = data.watched_at ?? data.watchedAt;
  let watchedAt = new Date();
  if (
    watchedAtRaw &&
    typeof watchedAtRaw === 'object' &&
    'toDate' in watchedAtRaw &&
    typeof (watchedAtRaw as { toDate: () => Date }).toDate === 'function'
  ) {
    watchedAt = (watchedAtRaw as { toDate: () => Date }).toDate();
  } else if (watchedAtRaw) {
    watchedAt = new Date(String(watchedAtRaw));
  }
  return {
    matchId: String(data.match_id ?? data.matchId ?? ''),
    source: (data.source as SupporterWatchSource) ?? 'world',
    watchedAt,
    progressMs: data.progress_ms != null ? Number(data.progress_ms) : undefined,
    title: String(data.title ?? ''),
    teams: String(data.teams ?? ''),
  };
}

async function loadLocal(uid: string): Promise<SupporterWatchEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SupporterWatchEntry[];
    return Array.isArray(parsed)
      ? parsed.map((e) => ({ ...e, watchedAt: new Date(e.watchedAt) }))
      : [];
  } catch {
    return [];
  }
}

async function saveLocal(uid: string, entries: SupporterWatchEntry[]): Promise<void> {
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(entries.slice(0, 120)));
}

let recordDebounce: ReturnType<typeof setTimeout> | null = null;
let pendingRecord: { uid: string; entry: Omit<SupporterWatchEntry, 'watchedAt'> } | null = null;

export const supporterWatchHistoryService = {
  async list(uid: string, max = 40): Promise<SupporterWatchEntry[]> {
    if (!uid) return [];

    if (isFirebaseConfigured()) {
      const authUid = getFirebaseAuth()?.currentUser?.uid;
      const database = getDb();
      if (authUid === uid && database) {
        try {
          const snap = await getDocs(
            query(
              collection(database, COL, uid, 'entries'),
              orderBy('watched_at', 'desc'),
              limit(max),
            ),
          );
          if (!snap.empty) {
            return snap.docs.map((d) => fromFirestore(d.data() as Record<string, unknown>));
          }
        } catch (e) {
          console.warn('[supporterWatchHistory] Firestore read:', e);
        }
      }
    }

    const local = await loadLocal(uid);
    return local.slice(0, max);
  },

  async record(
    uid: string,
    entry: Omit<SupporterWatchEntry, 'watchedAt'>,
    debounceMs = 800,
  ): Promise<void> {
    if (!uid || !entry.matchId) return;

    pendingRecord = { uid, entry };
    if (recordDebounce) clearTimeout(recordDebounce);

    recordDebounce = setTimeout(() => {
      void (async () => {
        const payload = pendingRecord;
        pendingRecord = null;
        if (!payload) return;
        await supporterWatchHistoryService.recordImmediate(payload.uid, payload.entry);
      })();
    }, debounceMs);
  },

  async recordImmediate(
    uid: string,
    entry: Omit<SupporterWatchEntry, 'watchedAt'>,
  ): Promise<void> {
    if (!uid || !entry.matchId) return;
    const full: SupporterWatchEntry = { ...entry, watchedAt: new Date() };

    const local = await loadLocal(uid);
    const without = local.filter((e) => e.matchId !== entry.matchId);
    await saveLocal(uid, [full, ...without]);

    if (!isFirebaseConfigured()) return;
    const authUid = getFirebaseAuth()?.currentUser?.uid;
    const database = getDb();
    if (!database || authUid !== uid) return;

    try {
      await setDoc(doc(database, COL, uid, 'entries', entry.matchId), {
        match_id: entry.matchId,
        source: entry.source,
        title: entry.title,
        teams: entry.teams,
        progress_ms: entry.progressMs ?? null,
        watched_at: serverTimestamp(),
      });
    } catch (e) {
      console.warn('[supporterWatchHistory] Firestore write:', e);
    }
  },

  async countSaved(uid: string): Promise<number> {
    if (!uid) return 0;
    if (isFirebaseConfigured()) {
      const authUid = getFirebaseAuth()?.currentUser?.uid;
      const database = getDb();
      if (authUid === uid && database) {
        try {
          const snap = await getDocs(collection(database, SAVED_COL, uid, 'entries'));
          return snap.size;
        } catch {
          /* fallback local */
        }
      }
    }
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}:saved:${uid}`);
      if (!raw) return 0;
      const ids = JSON.parse(raw) as string[];
      return Array.isArray(ids) ? ids.length : 0;
    } catch {
      return 0;
    }
  },

  async getStats(uid: string, followedCount: number): Promise<SupporterWatchStats> {
    const [watched, saved] = await Promise.all([
      supporterWatchHistoryService.list(uid, 200),
      supporterWatchHistoryService.countSaved(uid),
    ]);
    return { watched: watched.length, saved, followed: followedCount };
  },

  async recommendMatchIds(uid: string, followedIds: string[], max = 6): Promise<string[]> {
    const history = await supporterWatchHistoryService.list(uid, 30);
    const seen = new Set(history.map((h) => h.matchId));
    const fromHistory = history.slice(0, max).map((h) => h.matchId);
    if (fromHistory.length >= max) return fromHistory;

    const teamKeys = followedIds.map((id) => id.toLowerCase());
    const teamMatches = history
      .filter((h) => teamKeys.some((k) => h.teams.toLowerCase().includes(k) || h.title.toLowerCase().includes(k)))
      .map((h) => h.matchId)
      .filter((id) => !seen.has(id));

    return [...new Set([...fromHistory, ...teamMatches])].slice(0, max);
  },
};
