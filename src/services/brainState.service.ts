import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UserRealtimeState } from '../core/state/userState.store';
import { userStateStore } from '../core/state/userState.store';
import {
  BRAIN_STATE_VERSION,
  fromFirestoreDoc,
  toFirestoreDoc,
  type BrainFirestoreDoc,
  type BrainPersistedState,
} from '../core/state/brainState.mapper';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';

const STORAGE_KEY = 'proday_v3_brain_v1';

function stateToPersisted(state: UserRealtimeState): BrainPersistedState {
  return {
    version: BRAIN_STATE_VERSION,
    health: state.health,
    progression: state.progression,
    lastAction: state.lastAction,
  };
}

export async function loadBrainStateLocal(uid: string): Promise<BrainPersistedState | null> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY}:${uid}`);
    if (!raw) return null;
    return JSON.parse(raw) as BrainPersistedState;
  } catch {
    return null;
  }
}

async function saveBrainStateLocal(uid: string, state: BrainPersistedState): Promise<void> {
  await AsyncStorage.setItem(`${STORAGE_KEY}:${uid}`, JSON.stringify(state));
}

export async function loadBrainStateRemote(uid: string): Promise<BrainPersistedState | null> {
  if (!isFirebaseConfigured()) return null;
  const database = getDb();
  if (!database) return null;

  try {
    const snap = await getDoc(doc(database, 'users', uid, 'v3_brain', 'state'));
    if (!snap.exists()) return null;
    return fromFirestoreDoc(snap.data() as BrainFirestoreDoc);
  } catch {
    return null;
  }
}

export async function saveBrainStateRemote(
  uid: string,
  state: BrainPersistedState
): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const database = getDb();
  if (!database) return;

  await setDoc(
    doc(database, 'users', uid, 'v3_brain', 'state'),
    {
      ...toFirestoreDoc(state),
      updated_at: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Charge le snapshot Brain (remote prioritaire, cache local en secours). */
export async function hydrateBrainState(uid: string): Promise<BrainPersistedState | null> {
  const remote = await loadBrainStateRemote(uid);
  if (remote) {
    await saveBrainStateLocal(uid, remote);
    return remote;
  }
  return loadBrainStateLocal(uid);
}

/** Persiste l'état temps réel (local immédiat + Firestore). */
export async function persistBrainState(uid: string, state: UserRealtimeState): Promise<void> {
  const payload = stateToPersisted(state);
  await saveBrainStateLocal(uid, payload);
  await saveBrainStateRemote(uid, payload);
}

/** Sauvegarde immédiate après action critique (évite perte si fermeture app). */
export async function flushBrainState(uid: string): Promise<void> {
  const snapshot = userStateStore.get();
  if (snapshot) {
    await persistBrainState(uid, snapshot);
  }
}

export async function clearBrainStateLocal(uid: string): Promise<void> {
  await AsyncStorage.removeItem(`${STORAGE_KEY}:${uid}`);
}
