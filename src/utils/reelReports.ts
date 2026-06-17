import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

const HIDDEN_KEY = 'proday:reel-reports-hidden';

export async function loadHiddenReels(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(HIDDEN_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw) as string[];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

async function hideReelLocally(bookmarkKey: string): Promise<void> {
  const hidden = await loadHiddenReels();
  hidden.add(bookmarkKey);
  await AsyncStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden]));
}

export async function reportReel(params: {
  bookmarkKey: string;
  reporterUid?: string;
  reason: string;
  sourceUrl: string;
}): Promise<void> {
  await hideReelLocally(params.bookmarkKey);
  if (!isFirebaseConfigured() || !params.reporterUid) return;
  const database = getDb();
  if (!database) return;
  try {
    await addDoc(collection(database, 'reel_reports'), {
      bookmark_key: params.bookmarkKey,
      reporter_uid: params.reporterUid,
      reason: params.reason.trim(),
      source_url: params.sourceUrl,
      created_at: serverTimestamp(),
    });
  } catch {
    // Le masquage local reste actif.
  }
}
