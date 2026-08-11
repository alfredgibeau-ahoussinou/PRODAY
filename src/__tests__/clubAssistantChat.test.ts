import { CLUB_SITE } from '../content/clubPageIdentity';

describe('clubAssistant client contract', () => {
  it('expose les tokens site pour le chat terminal', () => {
    expect(CLUB_SITE.accent).toBe('#006CFC');
  });
});
