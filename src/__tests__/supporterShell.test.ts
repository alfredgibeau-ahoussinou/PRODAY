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
  it('expose 5 onglets tribune primaires', () => {
    expect(getVisibleMainTabs('supporter', 'supporter')).toEqual(SUPPORTER_SHELL_TABS);
    expect(SUPPORTER_SHELL_TABS).toEqual([
      'home',
      'matchs',
      'feed',
      'messages',
      'profil',
    ]);
    expect(SUPPORTER_OVERFLOW_TABS).toEqual(['reels', 'shop']);
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
  it('aligne l’accent sur le site /supporter', () => {
    expect(SUPPORTER_SITE.accent).toBe('#C9B896');
    expect(SUPPORTER_SITE.deep).toBe('#0A0A08');
    expect(getSupporterPageIdentity('tribune').title).toMatch(/tribune/i);
    expect(supporterPageFromTab('feed')).toBe('suivis');
    expect(supporterPageFromTab('messages')).toBe('debats');
    expect(getSupporterPageIdentity('debats').title).toBe('Fil');
    expect(findSupporterNavItem('debats')?.label).toBe('Fil');
  });
});
