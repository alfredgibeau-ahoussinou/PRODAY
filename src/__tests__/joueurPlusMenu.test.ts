import { DEFAULT_PLATFORM_CONFIG } from '../models/PlatformConfig';
import {
  buildJoueurPlusMenuItems,
  isJoueurUnavailableTab,
  plusMenuFeatureFlag,
} from '../content/joueurPlusMenu';

const PLAYER_VISIBLE_TABS = [
  'home',
  'matchs',
  'feed',
  'profil',
  'plus',
  'messages',
  'recrutement',
  'reels',
  'covoiturage',
  'shop',
  'progression',
] as const;

describe('joueurPlusMenu', () => {
  it('expose les raccourcis principaux pour un joueur amateur', () => {
    const items = buildJoueurPlusMenuItems({
      ageGroup: 'adult',
      visibleTabs: [...PLAYER_VISIBLE_TABS],
      unreadCount: 3,
    });

    const ids = items.map((i) => i.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'messages',
        'recrutement',
        'train',
        'reels',
        'covoiturage',
        'shop',
        'progression',
        'settings',
        'coach_ia',
        'coach_humain',
      ]),
    );
    expect(ids).not.toContain('famille');

    const coachHumain = items.find((i) => i.id === 'coach_humain');
    expect(coachHumain?.label).toBe('Coach humain');
    expect(coachHumain?.action).toEqual({ kind: 'dashboard', view: 'train_coach' });

    const coachIa = items.find((i) => i.id === 'coach_ia');
    expect(coachIa?.label).toBe('Mon Coach IA');
    expect(coachIa?.action).toEqual({ kind: 'dashboard', view: 'tactics_coach' });

    const messages = items.find((i) => i.id === 'messages');
    expect(messages?.badge).toBe(3);
    expect(messages?.action).toEqual({ kind: 'tab', tab: 'messages' });

    const reels = items.find((i) => i.id === 'reels');
    expect(reels?.unavailable).toBe(false);
    const shop = items.find((i) => i.id === 'shop');
    expect(shop?.unavailable).toBe(false);
  });

  it('marque reels/shop/recrutement indisponibles quand les flags admin sont OFF', () => {
    const isFeatureEnabled = (key: string) =>
      !['community_reels', 'shop', 'mercato'].includes(key);

    const items = buildJoueurPlusMenuItems({
      ageGroup: 'adult',
      visibleTabs: [...PLAYER_VISIBLE_TABS],
      isFeatureEnabled,
    });

    expect(items.find((i) => i.id === 'reels')?.unavailable).toBe(true);
    expect(items.find((i) => i.id === 'shop')?.unavailable).toBe(true);
    expect(items.find((i) => i.id === 'recrutement')?.unavailable).toBe(true);
  });

  it('active reels/shop quand les flags admin sont ON', () => {
    const isFeatureEnabled = () => true;

    const items = buildJoueurPlusMenuItems({
      ageGroup: 'adult',
      visibleTabs: [...PLAYER_VISIBLE_TABS],
      isFeatureEnabled,
    });

    expect(items.find((i) => i.id === 'reels')?.unavailable).toBe(false);
    expect(items.find((i) => i.id === 'shop')?.unavailable).toBe(false);
  });

  it('affiche Famille pour un mineur', () => {
    const items = buildJoueurPlusMenuItems({
      ageGroup: 'youth',
      visibleTabs: ['home', 'profil', 'plus', 'famille', 'messages'],
      isMinor: true,
    });
    expect(items.some((i) => i.id === 'famille')).toBe(true);
  });

  it('mappe les tuiles Plus aux feature flags admin', () => {
    expect(plusMenuFeatureFlag('reels')).toBe('community_reels');
    expect(plusMenuFeatureFlag('shop')).toBe('shop');
    expect(plusMenuFeatureFlag('recrutement')).toBe('mercato');
    expect(plusMenuFeatureFlag('messages')).toBeNull();
  });

  it('isJoueurUnavailableTab suit les flags plateforme', () => {
    const flagsOff = {
      ...DEFAULT_PLATFORM_CONFIG.feature_flags,
      community_reels: false,
      shop: false,
      mercato: false,
    };
    expect(isJoueurUnavailableTab('reels', flagsOff)).toBe(true);
    expect(isJoueurUnavailableTab('shop', flagsOff)).toBe(true);
    expect(isJoueurUnavailableTab('recrutement', flagsOff)).toBe(true);
    expect(isJoueurUnavailableTab('home', flagsOff)).toBe(false);

    expect(
      isJoueurUnavailableTab('reels', DEFAULT_PLATFORM_CONFIG.feature_flags),
    ).toBe(false);
  });
});
