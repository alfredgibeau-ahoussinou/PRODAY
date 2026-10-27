import type { MainTabId } from '../../../navigation/mainTabConfig';

/**
 * Dock supporter indépendant (rebuild) :
 * Accueil · Matchs · Compétitions · Mes clubs · Vidéos · Profil
 *
 * Mapping MainTabId pour réutiliser BottomTabBar / TabNavigationProvider.
 */
export type SupporterDockTabId =
  | 'home'
  | 'matchs'
  | 'feed'
  | 'plus'
  | 'reels'
  | 'profil';

export const SUPPORTER_DOCK_TABS: SupporterDockTabId[] = [
  'home',
  'matchs',
  'feed',
  'plus',
  'reels',
  'profil',
];

export function isSupporterDockTab(tab: MainTabId): tab is SupporterDockTabId {
  return (SUPPORTER_DOCK_TABS as readonly string[]).includes(tab);
}
