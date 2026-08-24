jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import {
  accentFromLogoUri,
  buildClubThemeTokens,
  extractColorsFromLogoUri,
} from '../utils/clubDynamicTheme';
import { resolveClubBrandColors } from '../utils/clubBrandColors';

describe('clubDynamicTheme', () => {
  it('préfère les couleurs stockées du club', () => {
    const brand = resolveClubBrandColors({
      id: 'c1',
      name: 'FC Test',
      primary_color: '#E53935',
      secondary_color: '#FFFFFF',
    });
    expect(brand?.source).toBe('stored');
    expect(brand?.primary).toBe('#E53935');
    const tokens = buildClubThemeTokens({
      primary: brand!.primary,
      secondary: brand!.secondary,
      onAccent: '#FFFFFF',
    });
    expect(tokens.accent).toBe('#E53935');
    expect(tokens.secondary).toBe('#FFFFFF');
    expect(tokens.accentSoft).toContain('rgba');
  });

  it('dérive un accent stable depuis une URI logo', () => {
    const a = accentFromLogoUri('https://cdn.example/logos/alpha.png');
    const b = accentFromLogoUri('https://cdn.example/logos/alpha.png');
    const c = accentFromLogoUri('https://cdn.example/logos/beta.png');
    expect(a).toBe(b);
    expect(a).toMatch(/^#[0-9A-F]{6}$/i);
    expect(a).not.toBe(c);
  });

  it('extrait / dérive des couleurs depuis un logo (fallback natif)', async () => {
    const colors = await extractColorsFromLogoUri('https://cdn.example/club-badge.png');
    expect(colors).not.toBeNull();
    expect(colors!.primary).toMatch(/^#[0-9A-F]{6}$/i);
    expect(colors!.secondary).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('buildClubThemeTokens retombe sur l’émeraude Club par défaut (canvas sombre)', () => {
    const tokens = buildClubThemeTokens(null);
    expect(tokens.accent).toBe('#10B981');
    expect(tokens.onAccent).toBeTruthy();
    expect(tokens.isLight).toBe(false);
    expect(tokens.bg.toLowerCase()).toBe('#000000');
    expect(tokens.headerWash.toLowerCase()).toBe('#000000');
    expect(tokens.surface.toLowerCase()).toBe('#0a0a0a');
    expect(tokens.surface.toLowerCase()).not.toBe('#ffffff');
  });
});
