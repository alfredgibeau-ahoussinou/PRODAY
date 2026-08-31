import type { ProductLineId } from '../models/ProductLine';
import type { MainTabId } from './mainTabConfig';

/** Onglets invité — Discover reste monté ; auth via overlay (pas le scaffold rebuild). */
const GUEST_VISIBLE_TABS_SUPPORTER: MainTabId[] = ['home', 'reels', 'shop', 'profil'];

/** Onglets invité — aperçu générique (amateur / pro). */
const GUEST_VISIBLE_TABS_DEFAULT: MainTabId[] = ['home', 'reels', 'shop', 'profil'];

const GUEST_VISIBLE_TABS_SANTE: MainTabId[] = ['home', 'reels', 'profil'];

export function getGuestVisibleTabs(line?: ProductLineId): MainTabId[] {
  if (line === 'sante') return GUEST_VISIBLE_TABS_SANTE;
  if (line === 'supporter') return GUEST_VISIBLE_TABS_SUPPORTER;
  if (line === 'sponsor') return ['home', 'matchs', 'messages', 'profil'];
  return GUEST_VISIBLE_TABS_DEFAULT;
}

export function isGuestTabAllowed(tab: MainTabId, line?: ProductLineId): boolean {
  return getGuestVisibleTabs(line).includes(tab);
}

/** Redirige vers un onglet invité autorisé. */
export function resolveGuestTab(tab: MainTabId, line?: ProductLineId): MainTabId {
  if (isGuestTabAllowed(tab, line)) return tab;
  return 'home';
}
