import type { ComponentType } from 'react';
import type { MainTabId } from '../../navigation/mainTabConfig';
import type { UserRole } from '../../models/User';
import { isMedicalPractitionerRole } from '../../content/medicalExperience';
import { isSponsorRole } from '../../content/sponsorExperience';
import { NextHomeScreen } from '../sections/NextHomeScreen';
import { MatchsSection } from '../sections/MatchsSection';
import { MercatoSection } from '../sections/MercatoSection';
import { ReelsSection } from '../sections/ReelsSection';
import { CarpoolSection } from '../sections/CarpoolSection';
import { HealthSection } from '../sections/HealthSection';
import { ShopSection } from '../sections/ShopSection';
import { ProfileSection } from '../sections/ProfileSection';
import { MessagesSection } from '../sections/MessagesSection';
import { FeedSection } from '../sections/FeedSection';
import { PhysioAgendaScreen } from '../../screens/medical/PhysioAgendaScreen';
import { PhysioMessagesScreen } from '../../screens/medical/PhysioMessagesScreen';
import { PhysioProfileTabScreen } from '../../screens/medical/PhysioProfileTabScreen';
import { SponsorCampaignsScreen } from '../../screens/sponsor/SponsorCampaignsScreen';
import { SponsorNetworkScreen } from '../../screens/sponsor/SponsorNetworkScreen';
import { SponsorProfileTabScreen } from '../../screens/sponsor/SponsorProfileTabScreen';

/** Routing ProDay Next — remplace l’implémentation legacy pour les rôles standard. */
const NEXT_SCREENS: Record<MainTabId, ComponentType> = {
  home: NextHomeScreen,
  recrutement: MercatoSection,
  matchs: MatchsSection,
  covoiturage: CarpoolSection,
  sante: HealthSection,
  feed: FeedSection,
  reels: ReelsSection,
  messages: MessagesSection,
  profil: ProfileSection,
  shop: ShopSection,
};

const PHYSIO_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: NextHomeScreen,
  matchs: PhysioAgendaScreen,
  messages: PhysioMessagesScreen,
  profil: PhysioProfileTabScreen,
};

const SPONSOR_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: NextHomeScreen,
  matchs: SponsorCampaignsScreen,
  messages: SponsorNetworkScreen,
  profil: SponsorProfileTabScreen,
};

export function resolveNextTabScreen(tab: MainTabId, role?: UserRole | null): ComponentType {
  if (isMedicalPractitionerRole(role)) {
    return PHYSIO_SCREENS[tab] ?? NEXT_SCREENS[tab];
  }
  if (isSponsorRole(role)) {
    return SPONSOR_SCREENS[tab] ?? NEXT_SCREENS[tab];
  }
  return NEXT_SCREENS[tab];
}

export function useNextTabBarImmersive(tab: MainTabId): boolean {
  return tab === 'reels';
}
