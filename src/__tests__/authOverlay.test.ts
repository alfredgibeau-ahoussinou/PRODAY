import {
  guestProfilTabOpensAuthOverlay,
  isGuestAuthOverlayVisible,
  resolveAuthBackAction,
} from '../navigation/authOverlay';
import { PANE_ENTER_SAFETY_MS, PANE_EXIT_SAFETY_MS } from '../motion/primitives/PaneTransition';

describe('auth overlay dismiss', () => {
  it('montre l’auth invité en overlay dès qu’un intent est posé', () => {
    expect(isGuestAuthOverlayVisible(true, 'login')).toBe(true);
    expect(isGuestAuthOverlayVisible(true, 'signup')).toBe(true);
    expect(isGuestAuthOverlayVisible(true, null)).toBe(false);
    expect(isGuestAuthOverlayVisible(false, 'login')).toBe(false);
  });

  it('ouvre l’overlay depuis le dock Profil sans changer d’onglet', () => {
    expect(guestProfilTabOpensAuthOverlay('profil', true, 'home')).toBe(true);
    expect(guestProfilTabOpensAuthOverlay('profil', true, 'reels')).toBe(true);
    expect(guestProfilTabOpensAuthOverlay('profil', true, 'profil')).toBe(false);
    expect(guestProfilTabOpensAuthOverlay('home', true, 'home')).toBe(false);
    expect(guestProfilTabOpensAuthOverlay('profil', false, 'home')).toBe(false);
  });

  it('au Retour login : unmount overlay (Discover reste), fallback onglet → home', () => {
    expect(resolveAuthBackAction(true)).toBe('unmount-overlay');
    expect(resolveAuthBackAction(false)).toBe('go-home-tab');
  });

  it('chaîne signup → login (overlay) puis login → Discover (unmount)', () => {
    expect(isGuestAuthOverlayVisible(true, 'signup')).toBe(true);
    expect(isGuestAuthOverlayVisible(true, 'login')).toBe(true);
    expect(resolveAuthBackAction(true)).toBe('unmount-overlay');
  });

  it('garde un filet PaneTransition plus court que 500ms si un onglet swap reste', () => {
    expect(PANE_EXIT_SAFETY_MS).toBeGreaterThanOrEqual(60);
    expect(PANE_ENTER_SAFETY_MS).toBeGreaterThanOrEqual(120);
    expect(PANE_EXIT_SAFETY_MS + PANE_ENTER_SAFETY_MS).toBeLessThan(500);
  });
});
