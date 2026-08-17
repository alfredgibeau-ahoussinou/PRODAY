import { coachChipTextProps } from '../utils/coachChipUi';
import { buildCoachThemeTokens } from '../utils/coachTeamTheme';

describe('coachChipUi', () => {
  it('coachChipTextProps utilise inverse sur fond accent (thème dark)', () => {
    const tokens = buildCoachThemeTokens({ variant: 'solid' });
    expect(tokens.isLight).toBe(false);
    expect(coachChipTextProps(true, tokens)).toEqual({
      inverse: true,
      accent: false,
      muted: false,
    });
    expect(coachChipTextProps(false, tokens)).toEqual({
      inverse: false,
      accent: false,
      muted: true,
    });
  });
});
