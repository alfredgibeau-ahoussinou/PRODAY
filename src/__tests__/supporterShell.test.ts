import { getVisibleMainTabs, getTabShortLabel } from '../content/poleExperience';
import {
  SUPPORTER_OVERFLOW_TABS,
  SUPPORTER_SHELL_TABS,
} from '../navigation/shells/productShellTabs';
import {
  SUPPORTER_SITE,
  getSupporterPageIdentity,
  supporterPageFromTab,
} from '../content/supporterPageIdentity';
import {
  openSupporterLive,
  stampMatchsDeepLink,
  supporterChapterFromPendingLink,
} from '../utils/supporterMatchsDeepLink';
import { openClubHelpChatbot, registerClubHelpOpener } from '../features/club/shell/clubHelpOpen';
import { resolveCityCoords } from '../utils/supporterCityGeo';
import { SUPPORTER_SPACE_COPY } from '../features/supporterSpace/theme/supporterSpaceTheme';
import { resolveTabIcon } from '../components/navigation/tabBarShared';

describe('Supporter Space shell navigation', () => {
  it('expose le dock Accueil · Matchs · ProDay · Clubs · Profil', () => {
    expect(SUPPORTER_SHELL_TABS).toEqual(['home', 'matchs', 'feed', 'plus', 'profil']);
    expect(SUPPORTER_OVERFLOW_TABS).toEqual(['reels', 'messages', 'shop']);
    expect(getVisibleMainTabs('supporter', 'supporter')).toEqual([
      'home',
      'matchs',
      'feed',
      'plus',
      'profil',
    ]);
    expect(getTabShortLabel('home', 'supporter', 'supporter')).toBe('Accueil');
    expect(getTabShortLabel('matchs', 'supporter', 'supporter')).toBe('Matchs');
    expect(getTabShortLabel('feed', 'supporter', 'supporter')).toBe('ProDay');
    expect(getTabShortLabel('plus', 'supporter', 'supporter')).toBe('Clubs');
    expect(getTabShortLabel('profil', 'supporter', 'supporter')).toBe('Profil');
  });

  it('définit le hero Accueil Supporter Space', () => {
    expect(SUPPORTER_SPACE_COPY.heroTitle).toMatch(/Ton football/i);
    expect(SUPPORTER_SPACE_COPY.heroSubtitle).toMatch(/APIs/i);
    expect(SUPPORTER_SPACE_COPY.dataSourceHint).toMatch(/APIs réelles/i);
    expect(SUPPORTER_SITE.accent).toBe('#3C00F0');
    expect(SUPPORTER_SITE.live).toBe('#22C55E');
  });

  it('Clubs = shield, ProDay ≠ heart', () => {
    expect(resolveTabIcon('plus', 'supporter', 'supporter')).toBe('shield');
    expect(resolveTabIcon('feed', 'supporter', 'supporter')).toBe('star-four-points');
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

describe('supporterPageIdentity Supporter Space', () => {
  it('aligne l’identité Accueil sur Supporter Space', () => {
    expect(getSupporterPageIdentity('tribune').eyebrow).toBe('Supporter Space');
    expect(getSupporterPageIdentity('tribune').title).toMatch(/accueil/i);
    expect(supporterPageFromTab('feed')).toBe('suivis');
    expect(supporterPageFromTab('plus')).toBe('suivis');
  });
});
