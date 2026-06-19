import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeeklyQuestionPopupMeta } from '../utils/weeklyQuestionPopupSchedule';

const POPUP_META_PREFIX = 'proday_weekly_q_popup_meta_v2';

function metaKey(uid: string, weekKey: string): string {
  return `${POPUP_META_PREFIX}:${uid}:${weekKey}`;
}

export async function getWeeklyQuestionPopupMeta(
  uid: string,
  weekKey: string
): Promise<WeeklyQuestionPopupMeta> {
  try {
    const raw = await AsyncStorage.getItem(metaKey(uid, weekKey));
    if (!raw) return { showCount: 0, lastShownAt: 0 };
    const parsed = JSON.parse(raw) as Partial<WeeklyQuestionPopupMeta>;
    return {
      showCount: typeof parsed.showCount === 'number' ? parsed.showCount : 0,
      lastShownAt: typeof parsed.lastShownAt === 'number' ? parsed.lastShownAt : 0,
    };
  } catch {
    return { showCount: 0, lastShownAt: 0 };
  }
}

export async function recordWeeklyQuestionPopupShown(
  uid: string,
  weekKey: string
): Promise<WeeklyQuestionPopupMeta> {
  const current = await getWeeklyQuestionPopupMeta(uid, weekKey);
  const next: WeeklyQuestionPopupMeta = {
    showCount: current.showCount + 1,
    lastShownAt: Date.now(),
  };
  await AsyncStorage.setItem(metaKey(uid, weekKey), JSON.stringify(next));
  return next;
}
