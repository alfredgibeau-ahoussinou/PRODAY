jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPoleHelpAllQuestions,
  getPoleHelpContent,
  getPoleHelpQuickSuggestions,
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

  it('fournit 10 à 15 entrées FAQ par pôle', () => {
    for (const key of POLE_KEYS) {
      const content = getPoleHelpContent(key);
      expect(content.entries.length).toBeGreaterThanOrEqual(10);
      expect(content.entries.length).toBeLessThanOrEqual(15);
      expect(content.welcome.length).toBeGreaterThan(10);
      expect(content.title.length).toBeGreaterThan(0);
      expect(content.bubbleTeaser.length).toBeGreaterThan(5);
    }
  });

  it('expose 4 suggestions rapides et toutes les questions avec fallback', () => {
    const content = getPoleHelpContent('supporter');
    expect(getPoleHelpQuickSuggestions(content)).toHaveLength(4);
    const all = getPoleHelpAllQuestions(content);
    expect(all).toHaveLength(content.entries.length + 1);
    expect(all.at(-1)).toEqual(POLE_HELP_OTHER_QUESTION);
    expect(POLE_HELP_OTHER_QUESTION.answer).toContain('support@proday.app');
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
