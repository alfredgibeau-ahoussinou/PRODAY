import { shouldShowWeeklyQuestionPopup } from '../utils/weeklyQuestionPopupSchedule';

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

describe('shouldShowWeeklyQuestionPopup', () => {
  it('ne propose pas si déjà répondu', () => {
    expect(shouldShowWeeklyQuestionPopup({ showCount: 0, lastShownAt: 0 }, true)).toBe(false);
  });

  it('propose la première fois', () => {
    expect(shouldShowWeeklyQuestionPopup({ showCount: 0, lastShownAt: 0 }, false)).toBe(true);
  });

  it('propose une seconde fois après 3 jours', () => {
    const now = Date.now();
    expect(
      shouldShowWeeklyQuestionPopup(
        { showCount: 1, lastShownAt: now - THREE_DAYS },
        false,
        now
      )
    ).toBe(true);
  });

  it('bloque après deux affichages', () => {
    expect(shouldShowWeeklyQuestionPopup({ showCount: 2, lastShownAt: 0 }, false)).toBe(false);
  });
});
