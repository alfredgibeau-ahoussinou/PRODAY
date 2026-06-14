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
import { FeedTabScreen } from '../screens/FeedTabScreen';
import { ReelsScreen } from '../screens/ReelsScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ProfilTabScreen } from '../screens/ProfilTabScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { PhysioAgendaScreen } from '../screens/medical/PhysioAgendaScreen';
import { PhysioMessagesScreen } from '../screens/medical/PhysioMessagesScreen';
import { PhysioProfileTabScreen } from '../screens/medical/PhysioProfileTabScreen';
import { SponsorCampaignsScreen } from '../screens/sponsor/SponsorCampaignsScreen';
import { SponsorNetworkScreen } from '../screens/sponsor/SponsorNetworkScreen';
import { SponsorProfileTabScreen } from '../screens/sponsor/SponsorProfileTabScreen';

const DEFAULT_SCREENS: Record<MainTabId, ComponentType> = {
  home: HomeScreen,
  recrutement: MercatoScreen,
  matchs: MatchsScreen,
  covoiturage: CarpoolScreen,
  sante: HealthProfessionalsScreen,
  feed: FeedTabScreen,
  reels: ReelsScreen,
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

const SPONSOR_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: HomeScreen,
  matchs: SponsorCampaignsScreen,
  messages: SponsorNetworkScreen,
  profil: SponsorProfileTabScreen,
};

export function resolveMainTabScreen(
  tab: MainTabId,
  role?: UserRole | null
): ComponentType {
  if (isMedicalPractitionerRole(role)) {
    return PHYSIO_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  if (isSponsorRole(role)) {
    return SPONSOR_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  return DEFAULT_SCREENS[tab];
}

export function shouldInjectShopTab(role?: UserRole | null): boolean {
  return !isMedicalPractitionerRole(role) && !isSponsorRole(role);
}
