import React from 'react';
import { HomeScreen } from '../screens/HomeScreen';
import { MercatoScreen } from '../screens/MercatoScreen';
import { MatchsScreen } from '../screens/MatchsScreen';
import { ArenaScreen } from '../screens/ArenaScreen';
import { SponsorsScreen } from '../screens/SponsorsScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { MAIN_TAB_ITEMS, type MainTabId } from './mainTabConfig';

export type { MainTabId } from './mainTabConfig';

const TAB_SCREENS: Record<MainTabId, React.ComponentType> = {
  home: HomeScreen,
  recrutement: MercatoScreen,
  matchs: MatchsScreen,
  messages: MessagesScreen,
  profil: AuthScreen,
};

/** Navigation alignée sur les maquettes (5 onglets) + modules secondaires */
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
