export interface WeeklyQuestionPopupMeta {
  showCount: number;
  lastShownAt: number;
}

const MAX_SHOWS_PER_WEEK = 2;
const REMINDER_GAP_MS = 3 * 24 * 60 * 60 * 1000;

export function shouldShowWeeklyQuestionPopup(
  meta: WeeklyQuestionPopupMeta,
  hasAnswered: boolean,
  now = Date.now()
): boolean {
  if (hasAnswered) return false;
  if (meta.showCount >= MAX_SHOWS_PER_WEEK) return false;
  if (meta.showCount === 0) return true;
  return now - meta.lastShownAt >= REMINDER_GAP_MS;
}
