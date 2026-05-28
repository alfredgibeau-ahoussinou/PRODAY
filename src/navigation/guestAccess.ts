import type { MainTabId } from './mainTabConfig';

/** Onglets accessibles sans compte */
export const GUEST_ALLOWED_TABS: MainTabId[] = ['home', 'profil'];

export function isGuestTabAllowed(tab: MainTabId): boolean {
  return GUEST_ALLOWED_TABS.includes(tab);
}
