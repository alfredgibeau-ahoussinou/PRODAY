import { getVisibleMainTabs } from '../content/poleExperience';
import {
  SUPPORTER_OVERFLOW_TABS,
  SUPPORTER_SHELL_TABS,
} from '../navigation/shells/productShellTabs';
import {
  SUPPORTER_NAV_FOLDERS,
  findSupporterNavItem,
  supporterNavFromTab,
} from '../features/supporter/navigation/supporterNavConfig';
import {
  SUPPORTER_SITE,
  getSupporterPageIdentity,
  supporterPageFromTab,
} from '../content/supporterPageIdentity';

describe('supporter shell navigation', () => {
  it('expose 5 onglets media center + overflow fil', () => {
    expect(getVisibleMainTabs('supporter', 'supporter')).toEqual(SUPPORTER_SHELL_TABS);
    expect(SUPPORTER_SHELL_TABS).toEqual([
      'home',
      'matchs',
      'feed',
      'reels',
      'profil',
    ]);
    expect(SUPPORTER_OVERFLOW_TABS).toEqual(['messages', 'shop']);
  });
});

describe('supporter nav config', () => {
  it('mappe dossiers Live · Communauté · Compte', () => {
    expect(SUPPORTER_NAV_FOLDERS.map((f) => f.id)).toEqual([
      'live',
      'communaute',
      'compte',
    ]);
    expect(supporterNavFromTab('home')).toBe('tribune');
    expect(supporterNavFromTab('messages')).toBe('debats');
    expect(findSupporterNavItem('moments')?.tab).toBe('reels');
  });
});

describe('supporterPageIdentity', () => {
  it('aligne l’accent sur le centre du football V2', () => {
    expect(SUPPORTER_SITE.accent).toBe('#3C00F0');
    expect(SUPPORTER_SITE.live).toBe('#34D399');
    expect(getSupporterPageIdentity('tribune').title).toMatch(/accueil/i);
    expect(getSupporterPageIdentity('tribune').eyebrow).toBe('Centre du football');
    expect(supporterPageFromTab('feed')).toBe('suivis');
    expect(supporterPageFromTab('reels')).toBe('moments');
    expect(getSupporterPageIdentity('moments').title).toBe('Vidéos');
  });
});
