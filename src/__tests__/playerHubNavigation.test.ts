import {
  AMATEUR_PLAYER_SHELL_TABS,
  AMATEUR_PLAYER_OVERFLOW_TABS,
  PRO_PLAYER_SHELL_TABS,
  PRO_PLAYER_OVERFLOW_TABS,
} from '../navigation/shells/productShellTabs';
import { getMobileRailLayout } from '../navigation/mobileTabConfig';
import { resolveAutoReturnTab } from '../utils/navigationDeepLink';
import type { MainTabId } from '../navigation/mainTabConfig';

const PLAYER_DOCK = new Set<MainTabId>(AMATEUR_PLAYER_SHELL_TABS);

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

  describe('resolveAutoReturnTab', () => {
    it('mémorise Plus → Messages', () => {
      expect(resolveAutoReturnTab('plus', 'messages', PLAYER_DOCK)).toBe('plus');
    });

    it('mémorise Plus → Mercato', () => {
      expect(resolveAutoReturnTab('plus', 'recrutement', PLAYER_DOCK)).toBe('plus');
    });

    it('respecte returnTo explicite', () => {
      expect(resolveAutoReturnTab('home', 'messages', PLAYER_DOCK, 'plus')).toBe('plus');
    });

    it('efface returnTab en revenant au dock', () => {
      expect(resolveAutoReturnTab('messages', 'plus', PLAYER_DOCK)).toBe(null);
    });

    it('conserve returnTab entre onglets overflow', () => {
      expect(resolveAutoReturnTab('messages', 'recrutement', PLAYER_DOCK)).toBeUndefined();
    });

    it('mémorise Accueil → Messages', () => {
      expect(resolveAutoReturnTab('home', 'messages', PLAYER_DOCK)).toBe('home');
    });

    it('respecte returnTo explicite depuis Feed vers Home (overlay train)', () => {
      expect(resolveAutoReturnTab('feed', 'home', PLAYER_DOCK, 'feed')).toBe('feed');
    });

    it('respecte returnTo explicite depuis Profil vers Home (overlay train)', () => {
      expect(resolveAutoReturnTab('profil', 'home', PLAYER_DOCK, 'profil')).toBe('profil');
    });
  });
});
