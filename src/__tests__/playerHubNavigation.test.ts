import {
  AMATEUR_PLAYER_SHELL_TABS,
  AMATEUR_PLAYER_OVERFLOW_TABS,
  PRO_PLAYER_SHELL_TABS,
  PRO_PLAYER_OVERFLOW_TABS,
} from '../navigation/shells/productShellTabs';
import { getMobileRailLayout } from '../navigation/mobileTabConfig';

describe('player hub navigation', () => {
  it('définit 5 onglets shell joueur amateur', () => {
    expect(AMATEUR_PLAYER_SHELL_TABS).toEqual([
      'home',
      'matchs',
      'feed',
      'profil',
      'plus',
    ]);
  });

  it('met équipe et secondaires en overflow amateur', () => {
    expect(AMATEUR_PLAYER_OVERFLOW_TABS).toEqual(
      expect.arrayContaining(['progression', 'recrutement', 'reels', 'messages', 'covoiturage', 'shop']),
    );
  });

  it('définit 5 onglets shell joueur pro', () => {
    expect(PRO_PLAYER_SHELL_TABS).toEqual([
      'home',
      'matchs',
      'feed',
      'profil',
      'plus',
    ]);
    expect(PRO_PLAYER_OVERFLOW_TABS).toContain('recrutement');
  });

  it('aligne le rail mobile joueur sur les 5 onglets', () => {
    const rail = getMobileRailLayout('amateur', 'player');
    expect(rail.flat).toEqual(AMATEUR_PLAYER_SHELL_TABS);
  });
});
