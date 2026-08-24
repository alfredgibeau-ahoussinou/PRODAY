import type { MainTabId } from './mainTabConfig';

export type GuestAuthIntent = 'login' | 'signup';

/**
 * Login / signup invité = overlay modal.
 * L’onglet d’origine (Discover) reste monté — pas de swap PaneTransition.
 */
export function isGuestAuthOverlayVisible(
  isGuest: boolean,
  intent: GuestAuthIntent | null,
): intent is GuestAuthIntent {
  return isGuest && intent != null;
}

/** Dock Profil invité : ouvrir l’overlay sans quitter l’onglet courant. */
export function guestProfilTabOpensAuthOverlay(
  tab: MainTabId,
  isGuest: boolean,
  activeTab: MainTabId,
): boolean {
  return isGuest && tab === 'profil' && activeTab !== 'profil';
}

export type AuthBackAction = 'unmount-overlay' | 'go-home-tab';

/**
 * Retour login sans connexion.
 * Overlay : unmount immédiat (contenu dessous déjà visible).
 * Fallback onglet Profil : revenir à home.
 */
export function resolveAuthBackAction(presentedAsOverlay: boolean): AuthBackAction {
  return presentedAsOverlay ? 'unmount-overlay' : 'go-home-tab';
}
