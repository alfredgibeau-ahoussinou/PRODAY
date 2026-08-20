import { getVisibleMainTabs, getTabShortLabel } from '../content/poleExperience';
import { SUPPORTER_SHELL_TABS } from '../navigation/shells/productShellTabs';
import { SUPPORTER_DOCK_TABS } from '../features/supporter/navigation/supporterTabs';
import { stubFootballDataProvider } from '../features/supporter/football';
import { resolveTabIcon } from '../components/navigation/tabBarShared';
import { getMobileRailLayout } from '../navigation/mobileTabConfig';

describe('Supporter scaffold navigation', () => {
  it('expose le dock Accueil · Matchs · Compétitions · Mes clubs · Vidéos · Profil', () => {
    expect(SUPPORTER_DOCK_TABS).toEqual([
      'home',
      'matchs',
      'feed',
      'plus',
      'reels',
      'profil',
    ]);
    expect(SUPPORTER_SHELL_TABS).toEqual(SUPPORTER_DOCK_TABS);
    expect(getVisibleMainTabs('supporter', 'supporter')).toEqual(SUPPORTER_DOCK_TABS);
    expect(getTabShortLabel('home', 'supporter', 'supporter')).toBe('Accueil');
    expect(getTabShortLabel('matchs', 'supporter', 'supporter')).toBe('Matchs');
    expect(getTabShortLabel('feed', 'supporter', 'supporter')).toBe('Compét.');
    expect(getTabShortLabel('plus', 'supporter', 'supporter')).toBe('Clubs');
    expect(getTabShortLabel('reels', 'supporter', 'supporter')).toBe('Vidéos');
    expect(getTabShortLabel('profil', 'supporter', 'supporter')).toBe('Profil');
  });

  it('dock flat identique pour rôle supporter et parent guest (line supporter)', () => {
    expect(getMobileRailLayout('supporter', 'supporter').flat).toEqual(SUPPORTER_DOCK_TABS);
    expect(getMobileRailLayout('supporter', 'parent').flat).toEqual(SUPPORTER_DOCK_TABS);
  });

  it('icônes dock scaffold', () => {
    expect(resolveTabIcon('plus', 'supporter', 'supporter')).toBe('shield');
    expect(resolveTabIcon('feed', 'supporter', 'supporter')).toBe('trophy');
    expect(resolveTabIcon('reels', 'supporter', 'supporter')).toBe('videocam');
  });

  it('FootballDataProvider stub renvoie des listes vides', async () => {
    await expect(stubFootballDataProvider.getFixtures()).resolves.toEqual([]);
    await expect(stubFootballDataProvider.getLiveMatches()).resolves.toEqual([]);
    await expect(stubFootballDataProvider.getMatch('x')).resolves.toBeNull();
    await expect(stubFootballDataProvider.getCompetitions()).resolves.toEqual([]);
  });
});
