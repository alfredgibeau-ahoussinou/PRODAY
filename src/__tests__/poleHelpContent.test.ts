import {
  getPoleHelpContent,
  getPoleHelpQuickSuggestions,
  resolvePoleHelpPoleKey,
  resolvePoleHelpUsesBriefcaseIcon,
} from '../content/poleHelpContent';

const POLE_KEYS = [
  'amateur',
  'supporter',
  'sante',
  'pro_player',
  'pro_club',
  'pro_staff',
] as const;

describe('poleHelpContent', () => {
  it('résout la clé pôle pour les 6 univers carousel', () => {
    expect(resolvePoleHelpPoleKey('amateur')).toBe('amateur');
    expect(resolvePoleHelpPoleKey('supporter')).toBe('supporter');
    expect(resolvePoleHelpPoleKey('sante')).toBe('sante');
    expect(resolvePoleHelpPoleKey('pro_player')).toBe('pro_player');
    expect(resolvePoleHelpPoleKey('pro_club')).toBe('pro_club');
    expect(resolvePoleHelpPoleKey('pro_staff')).toBe('pro_staff');
  });

  it('mappe homme/woman vers amateur', () => {
    expect(resolvePoleHelpPoleKey('homme')).toBe('amateur');
    expect(resolvePoleHelpPoleKey('woman')).toBe('amateur');
  });

  it('segmente le legacy pro par rôle', () => {
    expect(resolvePoleHelpPoleKey('pro', 'club')).toBe('pro_club');
    expect(resolvePoleHelpPoleKey('pro', 'coach')).toBe('pro_staff');
    expect(resolvePoleHelpPoleKey('pro', 'player')).toBe('pro_player');
  });

  it('fournit au moins 4 entrées FAQ par pôle', () => {
    for (const key of POLE_KEYS) {
      const content = getPoleHelpContent(key);
      expect(content.entries.length).toBeGreaterThanOrEqual(4);
      expect(content.welcome.length).toBeGreaterThan(10);
      expect(content.title.length).toBeGreaterThan(0);
    }
  });

  it('expose 4 suggestions rapides', () => {
    const content = getPoleHelpContent('supporter');
    expect(getPoleHelpQuickSuggestions(content)).toHaveLength(4);
  });

  it('utilise la valise uniquement pour pro_staff et rôles staff legacy', () => {
    expect(resolvePoleHelpUsesBriefcaseIcon('pro_staff')).toBe(true);
    expect(resolvePoleHelpUsesBriefcaseIcon('pro', 'agent')).toBe(true);
    expect(resolvePoleHelpUsesBriefcaseIcon('pro_player')).toBe(false);
    expect(resolvePoleHelpUsesBriefcaseIcon('amateur')).toBe(false);
    expect(resolvePoleHelpUsesBriefcaseIcon('supporter')).toBe(false);
  });
});
