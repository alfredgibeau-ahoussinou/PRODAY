import React from 'react';
import { HomeScreen } from '../screens/HomeScreen';
import { MercatoScreen } from '../screens/MercatoScreen';
import { MatchsScreen } from '../screens/MatchsScreen';
import { ArenaScreen } from '../screens/ArenaScreen';
import { SponsorsScreen } from '../screens/SponsorsScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { FeedTabScreen } from '../screens/FeedTabScreen';
import { HealthProfessionalsScreen } from '../screens/HealthProfessionalsScreen';
import { CarpoolScreen } from '../screens/CarpoolScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { MAIN_TAB_ITEMS, type MainTabId } from './mainTabConfig';

export type { MainTabId } from './mainTabConfig';

const TAB_SCREENS: Record<MainTabId, React.ComponentType> = {
  home: HomeScreen,
  recrutement: MercatoScreen,
  matchs: MatchsScreen,
  covoiturage: CarpoolScreen,
  sante: HealthProfessionalsScreen,
  feed: FeedTabScreen,
  messages: MessagesScreen,
  profil: AuthScreen,
  shop: ShopScreen,
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
  { id: 'arena', label: 'Arena', screen: ArenaScreen },
  { id: 'sponsors', label: 'Sponsors', screen: SponsorsScreen },
] as const;
