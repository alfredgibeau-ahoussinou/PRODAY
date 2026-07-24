import type { User } from '../models/User';
import {
  genderToPlayerSegment,
  resolvePlayerSegment,
  playerSegmentThemeKey,
} from '../utils/playerSegment';
import { getThemedColorsForLine } from '../theme/universeTheme';
import { getPoleTabBarChrome } from '../theme/poleTabBarTheme';

const basePlayer = {
  uid: 'u1',
  display_name: 'Test',
  email: 't@test.com',
  role: 'player' as const,
  is_verified: false,
  verification_status: 'NOT_REQUIRED' as const,
  profile: {},
  documents: [],
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
};

describe('playerSegment', () => {
  it('convertit le genre déclaré en segment', () => {
    expect(genderToPlayerSegment('men')).toBe('male');
    expect(genderToPlayerSegment('women')).toBe('female');
    expect(genderToPlayerSegment('minor')).toBe('minor');
  });

  it('résout le segment amateur depuis le profil', () => {
    const user = {
      ...basePlayer,
      product_line: 'amateur' as const,
      profile: { gender: 'women' as const },
    } as User;
    expect(resolvePlayerSegment(user, 'amateur')).toBe('female');
    expect(playerSegmentThemeKey('amateur', 'female')).toBe('amateur_female');
  });

  it('résout le segment pro joueur masculin', () => {
    const user = {
      ...basePlayer,
      product_line: 'pro_player' as const,
      profile: { gender: 'men' as const },
    } as User;
    expect(resolvePlayerSegment(user, 'pro_player')).toBe('male');
    const colors = getThemedColorsForLine('pro_player', 'male');
    expect(colors.accent).toBe('#60A5FA');
    const chrome = getPoleTabBarChrome('pro_player', 'player', 'female');
    expect(chrome.overflowKicker).toBe('PRO JOUEUSE');
  });

  it('déduit mineur depuis parental_settings', () => {
    const user = {
      ...basePlayer,
      product_line: 'amateur' as const,
      parental_settings: { is_minor: true },
    } as unknown as User;
    expect(resolvePlayerSegment(user, 'amateur')).toBe('minor');
    const colors = getThemedColorsForLine('amateur', 'minor');
    expect(colors.accent).toBe('#FBBF24');
  });

  it('déduit le segment féminin depuis product_line woman legacy', () => {
    const user = {
      ...basePlayer,
      product_line: 'woman' as const,
    } as User;
    expect(resolvePlayerSegment(user, 'pro_player')).toBe('female');
  });
});
