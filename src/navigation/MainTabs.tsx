import React from 'react';
import { HomeScreen } from '../screens/HomeScreen';
import { MercatoScreen } from '../screens/MercatoScreen';
import { MatchsScreen } from '../screens/MatchsScreen';
import { ArenaScreen } from '../screens/ArenaScreen';
import { SponsorsScreen } from '../screens/SponsorsScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { MessagesScreen } from '../screens/MessagesScreen';

/** Navigation alignée sur les maquettes (5 onglets) + modules roadmap */
export type MainTabId =
  | 'home'
  | 'recrutement'
  | 'matchs'
  | 'messages'
  | 'profil';

export const MAIN_TABS: {
  id: MainTabId;
  label: string;
  icon: string;
  screen: React.ComponentType;
}[] = [
  { id: 'home', label: 'Accueil', icon: 'home', screen: HomeScreen },
  { id: 'recrutement', label: 'Recrutement', icon: 'search', screen: MercatoScreen },
  { id: 'matchs', label: 'Matchs', icon: 'handshake', screen: MatchsScreen },
  { id: 'messages', label: 'Messages', icon: 'chat', screen: MessagesScreen },
  { id: 'profil', label: 'Profil', icon: 'user', screen: AuthScreen },
];

/** Modules Yoan accessibles depuis l’accueil ou menu secondaire */
export const SECONDARY_MODULES = [
  { id: 'arena', label: 'Arena', screen: ArenaScreen },
  { id: 'sponsors', label: 'Sponsors', screen: SponsorsScreen },
] as const;
