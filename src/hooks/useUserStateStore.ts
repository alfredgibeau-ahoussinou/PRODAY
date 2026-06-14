import { useSyncExternalStore } from 'react';
import { userStateStore, type UserRealtimeState } from '../core/state/userState.store';

/** Abonnement réactif au store Brain temps réel. */
export function useUserStateStore(): UserRealtimeState | null {
  return useSyncExternalStore(
    userStateStore.subscribe,
    userStateStore.get,
    () => null
  );
}
