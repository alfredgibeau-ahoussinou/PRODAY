import type { HealthSnapshot } from '../types/health';
import type { GamificationState } from '../../features/v3/models/gamification';
import type { UserActionKind } from '../actionDispatch';

export const BRAIN_STATE_VERSION = 1;

export interface BrainPersistedState {
  version: number;
  health: HealthSnapshot;
  progression: GamificationState;
  lastAction?: UserActionKind;
}

export interface BrainFirestoreDoc {
  version: number;
  health: HealthSnapshot;
  progression: {
    xp: number;
    level: number;
    xp_to_next: number;
    xp_progress: number;
    streak_days: number;
    rank_label: string;
    badges: Array<{
      id: string;
      label: string;
      description: string;
      icon: string;
      unlocked: boolean;
    }>;
  };
  last_action?: string;
}

export function toFirestoreDoc(state: BrainPersistedState): BrainFirestoreDoc {
  return {
    version: state.version,
    health: state.health,
    progression: {
      xp: state.progression.xp,
      level: state.progression.level,
      xp_to_next: state.progression.xpToNext,
      xp_progress: state.progression.xpProgress,
      streak_days: state.progression.streakDays,
      rank_label: state.progression.rankLabel,
      badges: state.progression.badges.map((b) => ({
        id: b.id,
        label: b.label,
        description: b.description,
        icon: b.icon,
        unlocked: b.unlocked,
      })),
    },
    // Firestore rejette `undefined` : la clé n'existe que si une action réelle a été jouée.
    ...(state.lastAction ? { last_action: state.lastAction } : {}),
  };
}

export function fromFirestoreDoc(raw: BrainFirestoreDoc | null | undefined): BrainPersistedState | null {
  if (!raw?.health || !raw.progression) return null;
  if (raw.version != null && raw.version > BRAIN_STATE_VERSION) return null;

  return {
    version: raw.version ?? 1,
    health: raw.health,
    progression: {
      xp: raw.progression.xp ?? 0,
      level: raw.progression.level ?? 1,
      xpToNext: raw.progression.xp_to_next ?? 200,
      xpProgress: raw.progression.xp_progress ?? 0,
      streakDays: raw.progression.streak_days ?? 1,
      rankLabel: raw.progression.rank_label ?? 'Rookie',
      badges: (raw.progression.badges ?? []).map((b) => ({
        id: b.id as GamificationState['badges'][number]['id'],
        label: b.label,
        description: b.description,
        icon: b.icon,
        unlocked: b.unlocked,
      })),
    },
    lastAction: raw.last_action as UserActionKind | undefined,
  };
}

export function mergeProgression(
  computed: GamificationState,
  persisted?: GamificationState | null
): GamificationState {
  if (!persisted || persisted.xp <= computed.xp) return computed;
  return {
    ...persisted,
    streakDays: Math.max(persisted.streakDays, computed.streakDays),
    badges: persisted.badges.map((badge) => {
      const fresh = computed.badges.find((b) => b.id === badge.id);
      return fresh && fresh.unlocked && !badge.unlocked ? fresh : badge;
    }),
  };
}
