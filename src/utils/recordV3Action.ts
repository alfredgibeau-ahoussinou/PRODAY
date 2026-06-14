import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../models/User';
import type { UserActionKind } from '../core/actionDispatch';
import { userStateStore } from '../core/state/userState.store';
import { flushBrainState } from '../services/brainState.service';
import { getProfileCompletion } from './profileCompletion';
import { isV3ShellEnabled } from '../config/featureFlags';
import { trackV3Event } from '../core/analytics/v3Events';
import type { GamificationState } from '../features/v3/models/gamification';

export const PROFILE_COMPLETION_XP_THRESHOLD = 80;
const PROFILE_XP_AWARD_KEY = 'proday_v3_profile_complete_xp_v1';

const awardedProfileXpUids = new Set<string>();

const defaultProgression: GamificationState = {
  xp: 0,
  level: 1,
  xpToNext: 200,
  xpProgress: 0,
  streakDays: 1,
  badges: [],
  rankLabel: 'Rookie',
};

/** Enregistre une action V3 (XP + flush Brain). */
export function recordV3UserAction(user: User, action: UserActionKind): void {
  const progression = userStateStore.get()?.progression ?? defaultProgression;
  const completion = getProfileCompletion(user).percent;
  userStateStore.applyAction(
    user,
    action,
    {
      upcomingEventsCount: 0,
      pendingConvocations: 0,
      recentMatchCount: 0,
      streakDays: 1,
      globalScore: completion,
    },
    progression
  );
  trackV3Event('v3_user_action', { action, uid: user.uid });
  void flushBrainState(user.uid);
}

/** Charge le cache local « profil complété » (évite double XP). */
export async function hydrateProfileCompletionAward(uid: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(`${PROFILE_XP_AWARD_KEY}:${uid}`);
    if (raw) awardedProfileXpUids.add(uid);
  } catch {
    /* ignore */
  }
}

/** Réinitialise le cache (tests uniquement). */
export function resetProfileCompletionAwardCache(): void {
  awardedProfileXpUids.clear();
}

/** XP `complete_profile` une fois le profil ≥ 80 %. */
export function maybeRecordProfileCompletion(user: User): void {
  if (!isV3ShellEnabled()) return;
  if (awardedProfileXpUids.has(user.uid)) return;

  const completion = getProfileCompletion(user).percent;
  if (completion < PROFILE_COMPLETION_XP_THRESHOLD) return;

  awardedProfileXpUids.add(user.uid);
  recordV3UserAction(user, 'complete_profile');
  void AsyncStorage.setItem(`${PROFILE_XP_AWARD_KEY}:${user.uid}`, '1');
}
