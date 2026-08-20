import { getVisibleMainTabs, getTabShortLabel } from '../content/poleExperience';
import {
  SUPPORTER_OVERFLOW_TABS,
  SUPPORTER_PLUS_DESTINATION_TABS,
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
import { buildSupporterPlusMenuItems } from '../content/supporterPlusMenu';
import {
  openSupporterLive,
  stampMatchsDeepLink,
  supporterChapterFromPendingLink,
} from '../utils/supporterMatchsDeepLink';
import { openClubHelpChatbot, registerClubHelpOpener } from '../features/club/shell/clubHelpOpen';
import { resolveCityCoords } from '../utils/supporterCityGeo';

describe('supporter shell navigation', () => {
  it('expose le dock Accueil · Matchs · Profil · Plus', () => {
    expect(SUPPORTER_SHELL_TABS).toEqual(['home', 'matchs', 'profil', 'plus']);
    expect(SUPPORTER_OVERFLOW_TABS).toEqual([]);
    expect(getVisibleMainTabs('supporter', 'supporter')).toEqual([
      ...SUPPORTER_SHELL_TABS,
      ...SUPPORTER_PLUS_DESTINATION_TABS,
    ]);
    expect(getVisibleMainTabs('supporter', 'supporter')).toEqual([
      'home',
      'matchs',
      'profil',
      'plus',
      'feed',
      'reels',
      'messages',
      'shop',
    ]);
    expect(getTabShortLabel('plus', 'supporter', 'supporter')).toBe('Plus');
  });

  it('liste les destinations Plus attendues', () => {
    const ids = buildSupporterPlusMenuItems().map((item) => item.id);
    expect(ids).toEqual([
      'live',
      'explorer',
      'videos',
      'fil',
      'carte',
      'suivis',
      'ia',
      'shop',
    ]);
  });

  it('applique le chapitre Live même si Matchs est déjà ouvert', () => {
    const first = stampMatchsDeepLink({ supporterChapter: 'live' });
    const second = stampMatchsDeepLink(first);
    expect(supporterChapterFromPendingLink(first)).toBe('live');
    expect(second.applyNonce).toBeGreaterThan(first.applyNonce ?? 0);
  });

  it('ouvre le Live via overlay Accueil ou via Matchs', () => {
    const overlay = jest.fn();
    const matchs = jest.fn();
    openSupporterLive({ showOverlay: overlay, openMatchsLive: matchs });
    expect(overlay).toHaveBeenCalledTimes(1);
    expect(matchs).not.toHaveBeenCalled();
    openSupporterLive({ openMatchsLive: matchs });
    expect(matchs).toHaveBeenCalledTimes(1);
  });
});

describe('supporter help opener', () => {
  afterEach(() => {
    registerClubHelpOpener(null);
  });

  it('retourne false sans listener, true avec listener', () => {
    expect(openClubHelpChatbot()).toBe(false);
    const open = jest.fn();
    registerClubHelpOpener(open);
    expect(openClubHelpChatbot()).toBe(true);
    expect(open).toHaveBeenCalledTimes(1);
  });
});

describe('supporter city geo', () => {
  it('ne crash pas sans ville', () => {
    const paris = resolveCityCoords(undefined);
    expect(paris.latitude).toBeCloseTo(48.8566, 2);
    expect(resolveCityCoords('').latitude).toBeCloseTo(48.8566, 2);
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
    expect(supporterPageFromTab('plus')).toBe('tribune');
    expect(getSupporterPageIdentity('moments').title).toBe('Vidéos');
  });
});
