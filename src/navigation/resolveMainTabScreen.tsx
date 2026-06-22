import type { ComponentType } from 'react';
import type { MainTabId } from './mainTabConfig';
import type { UserRole } from '../models/User';
import { isMedicalPractitionerRole } from '../content/medicalExperience';
import { isSponsorRole } from '../content/sponsorExperience';
import { HomeScreen } from '../screens/HomeScreen';
import { MercatoScreen } from '../screens/MercatoScreen';
import { MatchsScreen } from '../screens/MatchsScreen';
import { CarpoolScreen } from '../screens/CarpoolScreen';
import { HealthProfessionalsScreen } from '../screens/HealthProfessionalsScreen';
import { FamilleTabScreen } from '../screens/FamilleTabScreen';
import { FeedTabScreen } from '../screens/FeedTabScreen';
import { LazyReelsScreen } from '../screens/LazyReelsScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ProfilTabScreen } from '../screens/ProfilTabScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { PhysioAgendaScreen } from '../screens/medical/PhysioAgendaScreen';
import { PhysioMessagesScreen } from '../screens/medical/PhysioMessagesScreen';
import { PhysioProfileTabScreen } from '../screens/medical/PhysioProfileTabScreen';

const DEFAULT_SCREENS: Record<MainTabId, ComponentType> = {
  home: HomeScreen,
  recrutement: MercatoScreen,
  matchs: MatchsScreen,
  covoiturage: CarpoolScreen,
  sante: HealthProfessionalsScreen,
  feed: FeedTabScreen,
  reels: LazyReelsScreen,
  famille: FamilleTabScreen,
  messages: MessagesScreen,
  profil: ProfilTabScreen,
  shop: ShopScreen,
};

const PHYSIO_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: HomeScreen,
  matchs: PhysioAgendaScreen,
  messages: PhysioMessagesScreen,
  profil: PhysioProfileTabScreen,
};

export function resolveMainTabScreen(
  tab: MainTabId,
  role?: UserRole | null
): ComponentType {
  if (isMedicalPractitionerRole(role)) {
    return PHYSIO_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  return DEFAULT_SCREENS[tab];
}

export function shouldInjectShopTab(role?: UserRole | null): boolean {
  return !isMedicalPractitionerRole(role) && !isSponsorRole(role);
}
