import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type { ParentalJournalEntry, ParentalJournalEntryType } from '../models/ParentalSettings';
import { getScreenTimeDayKey } from '../utils/parentalScreenTime';

const MAX_ENTRIES = 40;
const LOCAL_PREFIX = 'proday_parental_journal:';

function entryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function localKey(uid: string): string {
  return `${LOCAL_PREFIX}${uid}:${getScreenTimeDayKey()}`;
}

function trimEntries(entries: ParentalJournalEntry[]): ParentalJournalEntry[] {
  return entries
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, MAX_ENTRIES);
}

async function syncToFirestore(uid: string, entries: ParentalJournalEntry[]): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const database = getDb();
  if (!database) return;
  try {
    await updateDoc(doc(database, 'users', uid), {
      'parental_settings.activity_journal': trimEntries(entries),
      updated_at: serverTimestamp(),
    });
  } catch {
    // Hors-ligne — le journal local reste disponible.
  }
}

export const parentalActivityJournalService = {
  async list(uid: string, remote?: ParentalJournalEntry[]): Promise<ParentalJournalEntry[]> {
    const remoteList = remote ?? [];
    try {
      const raw = await AsyncStorage.getItem(localKey(uid));
      const local: ParentalJournalEntry[] = raw ? JSON.parse(raw) : [];
      const merged = new Map<string, ParentalJournalEntry>();
      for (const e of [...remoteList, ...local]) merged.set(e.id, e);
      return trimEntries(Array.from(merged.values()));
    } catch {
      return trimEntries(remoteList);
    }
  },

  async log(
    uid: string,
    type: ParentalJournalEntryType,
    label: string,
    extra?: { section?: string; minutes?: number },
    remote?: ParentalJournalEntry[],
  ): Promise<ParentalJournalEntry[]> {
    const entry: ParentalJournalEntry = {
      id: entryId(),
      at: new Date().toISOString(),
      type,
      label,
      section: extra?.section,
      minutes: extra?.minutes,
    };
    const current = await this.list(uid, remote);
    const next = trimEntries([entry, ...current]);
    await AsyncStorage.setItem(localKey(uid), JSON.stringify(next));
    void syncToFirestore(uid, next);
    return next;
  },

  sectionLabel(tab: string): string {
    const map: Record<string, string> = {
      home: 'Accueil',
      matchs: 'Matchs',
      recrutement: 'Mercato',
      messages: 'Messages',
      covoiturage: 'Covoiturage',
      profil: 'Profil',
      shop: 'Boutique',
      reels: 'Reels',
      sante: 'Santé',
    };
    return map[tab] ?? tab;
  },
};
