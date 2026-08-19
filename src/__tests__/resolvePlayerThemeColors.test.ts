import { PLAYER_DARK } from '../theme/playerDarkPremium';
import {
  resolvePlayerThemeColors,
  sanitizePlayerThemePrefs,
  PLAYER_THEME_SWATCHES,
} from '../utils/resolvePlayerThemeColors';
import { resolveClubBrandColors } from '../utils/clubBrandColors';

describe('resolvePlayerThemeColors', () => {
  it('retourne le mint ProDay par défaut', () => {
    const colors = resolvePlayerThemeColors(null, null);
    expect(colors.mode).toBe('default');
    expect(colors.accent).toBe(PLAYER_DARK.accent);
    expect(colors.accentAlt).toBe(PLAYER_DARK.accentAlt);
    expect(colors.bg).toBe(PLAYER_DARK.bg);
  });

  it('applique les couleurs club en mode club', () => {
    const club = resolveClubBrandColors({ id: 'club-1', name: 'FC Test' });
    expect(club).not.toBeNull();
    const colors = resolvePlayerThemeColors({ mode: 'club' }, club);
    expect(colors.mode).toBe('club');
    expect(colors.accent).toBe(club!.primary);
    expect(colors.accentAlt).toBe(club!.secondary);
    expect(colors.accentSoft).toMatch(/^rgba\(/);
  });

  it('retombe sur ProDay si mode club sans couleurs', () => {
    const colors = resolvePlayerThemeColors({ mode: 'club' }, null);
    expect(colors.accent).toBe(PLAYER_DARK.accent);
  });

  it('applique les couleurs custom valides', () => {
    const colors = resolvePlayerThemeColors(
      {
        mode: 'custom',
        custom: { accent: '#FF6B35', accentSecondary: '#FFD60A' },
      },
      null,
    );
    expect(colors.mode).toBe('custom');
    expect(colors.accent).toBe('#FF6B35');
    expect(colors.accentAlt).toBe('#FFD60A');
  });

  it('ignore un hex custom invalide', () => {
    const colors = resolvePlayerThemeColors(
      { mode: 'custom', custom: { accent: 'not-a-color' } },
      null,
    );
    expect(colors.mode).toBe('default');
    expect(colors.accent).toBe(PLAYER_DARK.accent);
  });

  it('sanitizePlayerThemePrefs nettoie les champs', () => {
    const prefs = sanitizePlayerThemePrefs({
      mode: 'custom',
      custom: {
        accent: '00e676',
        accentSecondary: '#2DD4BF',
        background: '#0A0A0F',
      },
    });
    expect(prefs.mode).toBe('custom');
    expect(prefs.custom?.accent).toBe('#00E676');
    expect(prefs.custom?.accentSecondary).toBe('#2DD4BF');
    expect(prefs.custom?.background).toBe('#0A0A0F');
  });

  it('expose une palette prédéfinie football-friendly', () => {
    expect(PLAYER_THEME_SWATCHES.length).toBeGreaterThanOrEqual(8);
    expect(PLAYER_THEME_SWATCHES).toContain(PLAYER_DARK.accent);
  });

  it('derive des couleurs club stables pour le même id', () => {
    const a = resolveClubBrandColors({ id: 'club-stable', name: 'Alpha' });
    const b = resolveClubBrandColors({ id: 'club-stable', name: 'Beta' });
    expect(a?.primary).toBe(b?.primary);
  });

  it('priorise les couleurs stockées du club', () => {
    const colors = resolveClubBrandColors({
      id: 'c1',
      name: 'Club',
      primary_color: '#E53935',
      secondary_color: '#FFFFFF',
    });
    expect(colors?.source).toBe('stored');
    expect(colors?.primary).toBe('#E53935');
    expect(colors?.secondary).toBe('#FFFFFF');
  });
});
