import type { ProductLineId } from '../models/ProductLine';
import type { MainTabId } from './mainTabConfig';

/** Onglets rendus pour un invité (accueil, reels, profil, shop). */
export const GUEST_VISIBLE_TABS: MainTabId[] = ['home', 'reels', 'profil', 'shop'];

const GUEST_VISIBLE_TABS_SANTE: MainTabId[] = ['home', 'profil', 'shop'];

export function getGuestVisibleTabs(line?: ProductLineId): MainTabId[] {
  if (line === 'sante') return GUEST_VISIBLE_TABS_SANTE;
  return GUEST_VISIBLE_TABS;
}

export function isGuestTabAllowed(tab: MainTabId, line?: ProductLineId): boolean {
  return getGuestVisibleTabs(line).includes(tab);
}

/** Redirige vers connexion si l’onglet demandé n’est pas accessible en invité. */
export function resolveGuestTab(tab: MainTabId, line?: ProductLineId): MainTabId {
  if (isGuestTabAllowed(tab, line)) return tab;
  return 'profil';
}
