import {
  carpoolPaletteDefault,
  carpoolPaletteFromCoach,
} from '../utils/carpoolUiPalette';
import { buildCoachThemeTokens } from '../utils/coachTeamTheme';

describe('carpoolCoachPalette', () => {
  it('solid coach tokens → dark surface (not #FFFFFF)', () => {
    const tokens = buildCoachThemeTokens({ variant: 'solid', teamId: 'team-1' });
    const palette = carpoolPaletteFromCoach(tokens);

    expect(palette.surface).not.toBe('#FFFFFF');
    expect(palette.bg).toBe(tokens.bg);
    expect(palette.ink).toBe(tokens.foreground);
    expect(palette.signal).toBe(tokens.accent);
  });

  it('clear coach tokens → light bg #FFFFFF', () => {
    const tokens = buildCoachThemeTokens({ variant: 'clear', teamId: 'team-1' });
    const palette = carpoolPaletteFromCoach(tokens);

    expect(palette.bg).toBe('#FFFFFF');
    expect(palette.surface).toBe('#F2F2F7');
  });

  it('default palette matches CARPOOL_SITE OLED dark surfaces', () => {
    const palette = carpoolPaletteDefault();

    expect(palette.surface).toBe('#14141A');
    expect(palette.bg).toBe('#000000');
  });
});
