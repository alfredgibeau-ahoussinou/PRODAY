import {
  featureFlagForTab,
  filterTabsByFeatureFlags,
  isPlatformFeatureEnabled,
} from '../content/platformFeatureFlags';
import { DEFAULT_PLATFORM_CONFIG } from '../models/PlatformConfig';
import type { MainTabId } from '../navigation/mainTabConfig';

const baseTabs: MainTabId[] = ['home', 'recrutement', 'shop', 'reels', 'profil'];

describe('platformFeatureFlags', () => {
  it('filtre les onglets liés aux flags OFF', () => {
    const flags = {
      ...DEFAULT_PLATFORM_CONFIG.feature_flags,
      mercato: false,
      shop: false,
      community_reels: false,
    };
    expect(filterTabsByFeatureFlags(baseTabs, flags)).toEqual(['home', 'profil']);
  });

  it('laisse passer les onglets si flags ON', () => {
    expect(
      filterTabsByFeatureFlags(baseTabs, DEFAULT_PLATFORM_CONFIG.feature_flags),
    ).toEqual(baseTabs);
  });

  it('mappe tab → flag', () => {
    expect(featureFlagForTab('recrutement')).toBe('mercato');
    expect(featureFlagForTab('shop')).toBe('shop');
    expect(featureFlagForTab('reels')).toBe('community_reels');
    expect(featureFlagForTab('home')).toBeNull();
  });

  it('isPlatformFeatureEnabled lit strictement true', () => {
    const flags = { ...DEFAULT_PLATFORM_CONFIG.feature_flags, supporter: false };
    expect(isPlatformFeatureEnabled(flags, 'supporter')).toBe(false);
    expect(isPlatformFeatureEnabled(flags, 'registration_open')).toBe(true);
  });
});
