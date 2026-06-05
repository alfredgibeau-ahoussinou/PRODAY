import type { MainTabId } from './mainTabConfig';

/** Onglets rendus pour un invité (accueil + auth via profil, sans menu). */
export const GUEST_VISIBLE_TABS: MainTabId[] = ['home', 'profil', 'shop'];

export function getGuestVisibleTabs(): MainTabId[] {
  return GUEST_VISIBLE_TABS;
}

export function isGuestTabAllowed(tab: MainTabId): boolean {
  return GUEST_VISIBLE_TABS.includes(tab);
}

/** Redirige vers connexion si l’onglet demandé n’est pas accessible en invité. */
export function resolveGuestTab(tab: MainTabId): MainTabId {
  if (isGuestTabAllowed(tab)) return tab;
  return 'profil';
}
