import { CLUB_SITE } from '../content/clubPageIdentity';

describe('clubAssistant client contract', () => {
  it('expose les tokens site pour le chat terminal', () => {
    // Or mesuré sur la charte de référence (D-011).
    expect(CLUB_SITE.accent).toBe('#F8D548');
  });
});
