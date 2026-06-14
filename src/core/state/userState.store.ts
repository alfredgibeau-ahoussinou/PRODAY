import type { HealthSnapshot } from '../types/health';
import type { AiCoreOutput } from '../types/ai';
import type { GamificationState } from '../../features/v3/models/gamification';
import { eventBus } from '../events/eventBus';
import { dispatchUserAction, type ActionContext, type UserActionKind } from '../actionDispatch';
import type { User } from '../../models/User';

export interface UserRealtimeState {
  health: HealthSnapshot;
  progression: GamificationState;
  lastAction?: UserActionKind;
  refreshToken: number;
}

let snapshot: UserRealtimeState | null = null;
const listeners = new Set<(state: UserRealtimeState | null) => void>();

function notify(): void {
  listeners.forEach((fn) => fn(snapshot));
}

/** Store état utilisateur temps réel (spec §5). */
export const userStateStore = {
  get(): UserRealtimeState | null {
    return snapshot;
  },

  subscribe(fn: (state: UserRealtimeState | null) => void): () => void {
    listeners.add(fn);
    fn(snapshot);
    return () => listeners.delete(fn);
  },

  applyAction(
    user: User,
    action: UserActionKind,
    context: ActionContext,
    progression: GamificationState
  ): UserRealtimeState {
    const result = dispatchUserAction(user, action, context);
    snapshot = {
      health: result.health,
      progression: {
        ...progression,
        xp: progression.xp + result.progressionDelta.xp,
      },
      lastAction: action,
      refreshToken: (snapshot?.refreshToken ?? 0) + 1,
    };
    notify();
    return snapshot;
  },

  setFromBrain(health: HealthSnapshot, progression: GamificationState): void {
    snapshot = {
      health,
      progression,
      refreshToken: (snapshot?.refreshToken ?? 0) + 1,
    };
    notify();
  },

  reset(): void {
    snapshot = null;
    notify();
  },
};

eventBus.on('user_action', () => {
  if (snapshot) {
    snapshot = { ...snapshot, refreshToken: snapshot.refreshToken + 1 };
    notify();
  }
});

export type { AiCoreOutput };
