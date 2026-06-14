import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { PlayerCategory, PlayerLevel } from '../constants/playerProfile';
import type { PositionFilterId } from '../content/candidatureChapters';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

const STORAGE_KEY = 'proday_mercato_alert_v1';
const NOTIFIED_POSTS_KEY = 'proday_mercato_alert_notified_v1';

export type MercatoAlertCriteria = {
  search: string;
  position: PositionFilterId;
  level: 'all' | PlayerLevel;
  category: 'all' | PlayerCategory;
  city: string;
  enabled: boolean;
};

export const DEFAULT_MERCATO_ALERT: MercatoAlertCriteria = {
  search: '',
  position: 'all',
  level: 'all',
  category: 'all',
  city: '',
  enabled: false,
};

export async function loadMercatoAlert(uid: string): Promise<MercatoAlertCriteria> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY}:${uid}`);
    if (!raw) return { ...DEFAULT_MERCATO_ALERT };
    return { ...DEFAULT_MERCATO_ALERT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_MERCATO_ALERT };
  }
}

async function syncMercatoAlertToFirestore(
  uid: string,
  criteria: MercatoAlertCriteria
): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const database = getDb();
  if (!database) return;

  await setDoc(
    doc(database, 'mercato_alerts', uid),
    {
      uid,
      search: criteria.search,
      position: criteria.position,
      level: criteria.level,
      category: criteria.category,
      city: criteria.city,
      enabled: criteria.enabled,
      updated_at: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function saveMercatoAlert(
  uid: string,
  criteria: MercatoAlertCriteria
): Promise<void> {
  await AsyncStorage.setItem(`${STORAGE_KEY}:${uid}`, JSON.stringify(criteria));
  try {
    await syncMercatoAlertToFirestore(uid, criteria);
  } catch {
    /* push serveur indisponible — alerte locale conservée */
  }
}

export async function loadNotifiedPostIds(uid: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(`${NOTIFIED_POSTS_KEY}:${uid}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export async function saveNotifiedPostIds(uid: string, ids: Set<string>): Promise<void> {
  const trimmed = [...ids].slice(-200);
  await AsyncStorage.setItem(`${NOTIFIED_POSTS_KEY}:${uid}`, JSON.stringify(trimmed));
}

/** Notification locale de secours quand de nouvelles annonces matchent l'alerte */
export async function notifyNewMercatoMatches(
  uid: string,
  postIds: string[],
  sampleTitle: string
): Promise<void> {
  if (postIds.length === 0) return;

  const notified = await loadNotifiedPostIds(uid);
  const fresh = postIds.filter((id) => !notified.has(id));
  if (fresh.length === 0) return;

  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nouvelle annonce Mercato',
        body:
          fresh.length === 1
            ? sampleTitle
            : `${fresh.length} nouvelles annonces correspondent à votre alerte.`,
        data: { type: 'mercato_alert', postId: fresh[0] },
      },
      trigger: null,
    });
  } catch {
    /* permissions refusées ou simulateur */
  }

  fresh.forEach((id) => notified.add(id));
  await saveNotifiedPostIds(uid, notified);
}
