import React from 'react';
import { HomeScreen } from '../screens/HomeScreen';
import { MercatoScreen } from '../screens/MercatoScreen';
import { MatchsScreen } from '../screens/MatchsScreen';
import { SponsorsScreen } from '../screens/SponsorsScreen';
import { ProfilTabScreen } from '../screens/ProfilTabScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { FamilleTabScreen } from '../screens/FamilleTabScreen';
import { FeedTabScreen } from '../screens/FeedTabScreen';
import { ReelsScreen } from '../screens/ReelsScreen';
import { CarpoolScreen } from '../screens/CarpoolScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { JoueurPlusHubScreen } from '../screens/joueur/JoueurPlusHubScreen';
import { ProDayMenuScreen } from '../screens/menu/ProDayMenuScreen';
import { RetiredRoleScreen } from '../screens/RetiredRoleScreen';
import { MAIN_TAB_ITEMS, type MainTabId } from './mainTabConfig';

export type { MainTabId } from './mainTabConfig';

const TAB_SCREENS: Record<MainTabId, React.ComponentType> = {
  home: HomeScreen,
  recrutement: MercatoScreen,
  matchs: MatchsScreen,
  covoiturage: CarpoolScreen,
  sante: RetiredRoleScreen,
  feed: FeedTabScreen,
  progression: RetiredRoleScreen,
  reels: ReelsScreen,
  famille: FamilleTabScreen,
  messages: MessagesScreen,
  profil: ProfilTabScreen,
  shop: ShopScreen,
  plus: ProDayMenuScreen,
};

export const MAIN_TABS: {
  id: MainTabId;
  label: string;
  icon: string;
  screen: React.ComponentType;
}[] = MAIN_TAB_ITEMS.map((tab) => ({
  ...tab,
  screen: TAB_SCREENS[tab.id],
}));

/** Modules accessibles depuis l’accueil ou menu secondaire */
export const SECONDARY_MODULES = [
  { id: 'sponsors', label: 'Sponsors', screen: SponsorsScreen },
] as const;
