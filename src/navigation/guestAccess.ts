import type { MainTabId } from './mainTabConfig';

/** Onglets accessibles sans compte (navigation libre, sans popup) */
export const GUEST_ALLOWED_TABS: MainTabId[] = [
  'home',
  'recrutement',
  'matchs',
  'feed',
  'messages',
  'profil',
];

export function isGuestTabAllowed(tab: MainTabId): boolean {
  return GUEST_ALLOWED_TABS.includes(tab);
}
