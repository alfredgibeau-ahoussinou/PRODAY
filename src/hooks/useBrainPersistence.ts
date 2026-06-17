import { useEffect, useRef } from 'react';
import type { User } from '../models/User';
import { userStateStore } from '../core/state/userState.store';
import { hydrateBrainState, persistBrainState } from '../services/brainState.service';
import { hydrateProfileCompletionAward } from '../utils/recordV3Action';

const SAVE_DEBOUNCE_MS = 2500;

/** Hydrate et persiste le Brain V3 (Firestore + cache local). */
export function useBrainPersistence(profile: User | null | undefined): void {
  const uid = profile?.uid;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedUid = useRef<string | null>(null);

  useEffect(() => {
    if (!uid) {
      hydratedUid.current = null;
      return;
    }

    if (hydratedUid.current === uid) return;
    hydratedUid.current = uid;

    let cancelled = false;
    void Promise.all([hydrateBrainState(uid), hydrateProfileCompletionAward(uid)]).then(
      ([persisted]) => {
        if (cancelled || !persisted) return;
        userStateStore.setFromBrain(persisted.health, persisted.progression);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const scheduleSave = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const snapshot = userStateStore.get();
        if (snapshot) {
          void persistBrainState(uid, snapshot);
        }
      }, SAVE_DEBOUNCE_MS);
    };

    const unsubscribe = userStateStore.subscribe(() => {
      scheduleSave();
    });

    return () => {
      unsubscribe();
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        const snapshot = userStateStore.get();
        if (snapshot) {
          void persistBrainState(uid, snapshot);
        }
      }
    };
  }, [uid]);
}
