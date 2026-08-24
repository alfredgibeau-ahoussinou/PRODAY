import type { MainTabId } from './mainTabConfig';

export type GuestAuthIntent = 'login' | 'signup';

/**
 * Fade-in overlay auth — Discover reste monté.
 * Plancher > 0 ; Retour = unmount immédiat (pas de leave opaque).
 */
export const AUTH_OVERLAY_ENTER = {
  fromOpacity: 0.42,
  ms: 160,
  reducedMs: 100,
  safetyMs: 180,
} as const;

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
