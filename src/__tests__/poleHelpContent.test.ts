jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPoleHelpContent,
  getPoleHelpQuickSuggestions,
  groupPoleHelpEntriesByCategory,
  POLE_HELP_CATEGORY_ORDER,
  POLE_HELP_OTHER_QUESTION,
  resolvePoleHelpPoleKey,
  resolvePoleHelpUsesBriefcaseIcon,
} from '../content/poleHelpContent';
import {
  dismissPoleHelpBubble,
  isPoleHelpBubbleDismissed,
} from '../services/poleHelpPreferences.service';

const POLE_KEYS = [
  'amateur',
  'supporter',
  'sante',
  'sponsor',
  'pro_player',
  'pro_club',
  'pro_staff',
] as const;

describe('poleHelpContent', () => {
  it('résout la clé pôle pour les univers carousel', () => {
    expect(resolvePoleHelpPoleKey('amateur')).toBe('amateur');
    expect(resolvePoleHelpPoleKey('supporter')).toBe('supporter');
    expect(resolvePoleHelpPoleKey('sante')).toBe('sante');
    expect(resolvePoleHelpPoleKey('sponsor')).toBe('sponsor');
    expect(resolvePoleHelpPoleKey('pro_staff', 'sponsor')).toBe('sponsor');
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

  it('fournit 25 à 35 entrées FAQ par pôle', () => {
    for (const key of POLE_KEYS) {
      const content = getPoleHelpContent(key);
      expect(content.entries.length).toBeGreaterThanOrEqual(25);
      expect(content.entries.length).toBeLessThanOrEqual(35);
      expect(content.welcome.length).toBeGreaterThan(10);
      expect(content.title.length).toBeGreaterThan(0);
      expect(content.bubbleTeaser.length).toBeGreaterThan(5);
    }
  });

  it('organise chaque entrée dans une catégorie connue', () => {
    for (const key of POLE_KEYS) {
      const content = getPoleHelpContent(key);
      for (const entry of content.entries) {
        expect(POLE_HELP_CATEGORY_ORDER).toContain(entry.category);
      }
    }
  });

  it('groupe les questions par catégorie avec libellés FR', () => {
    const content = getPoleHelpContent('amateur');
    const groups = groupPoleHelpEntriesByCategory(content);
    expect(groups.length).toBeGreaterThanOrEqual(8);
    expect(groups.reduce((n, g) => n + g.entries.length, 0)).toBe(content.entries.length);
    expect(groups[0]?.label.length).toBeGreaterThan(3);
  });

  it('expose 4 suggestions rapides et un fallback support', () => {
    const content = getPoleHelpContent('supporter');
    expect(getPoleHelpQuickSuggestions(content)).toHaveLength(4);
    expect(POLE_HELP_OTHER_QUESTION.answer).toContain('proday.admin@gmail.com');
  });

  it('utilise la valise uniquement pour pro_staff et rôles staff legacy', () => {
    expect(resolvePoleHelpUsesBriefcaseIcon('pro_staff')).toBe(true);
    expect(resolvePoleHelpUsesBriefcaseIcon('pro', 'agent')).toBe(true);
    expect(resolvePoleHelpUsesBriefcaseIcon('pro_player')).toBe(false);
    expect(resolvePoleHelpUsesBriefcaseIcon('amateur')).toBe(false);
    expect(resolvePoleHelpUsesBriefcaseIcon('supporter')).toBe(false);
  });
});

describe('poleHelpPreferences.service', () => {
  beforeEach(() => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockClear();
  });

  it('mémorise la fermeture de la bulle teaser', async () => {
    expect(await isPoleHelpBubbleDismissed()).toBe(false);
    await dismissPoleHelpBubble();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('pole_help_bubble_dismissed', '1');
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('1');
    expect(await isPoleHelpBubbleDismissed()).toBe(true);
  });
});
