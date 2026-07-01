import type { ComponentType } from 'react';
import type { MainTabId } from './mainTabConfig';
import type { ProductLineId } from '../models/ProductLine';
import { isProProductLine } from '../models/ProductLine';
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
import { SupporterMatchsScreen } from '../screens/SupporterMatchsScreen';
import { SupporterSuivisScreen } from '../screens/SupporterSuivisScreen';
import { ClubStructureScreen } from '../screens/ClubStructureScreen';
import { AmateurClubScreen } from '../screens/AmateurClubScreen';
import { ProPlayerCareerScreen } from '../screens/proPlayer/ProPlayerCareerScreen';
import { ProPlayerOpportunitiesScreen } from '../screens/proPlayer/ProPlayerOpportunitiesScreen';
import { ProPlayerPortfolioScreen } from '../screens/proPlayer/ProPlayerPortfolioScreen';
import { ProPlayerGroupScreen } from '../screens/proPlayer/ProPlayerGroupScreen';

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

const SUPPORTER_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  matchs: SupporterMatchsScreen,
  feed: SupporterSuivisScreen,
  messages: FeedTabScreen,
};

const PRO_CLUB_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: ClubStructureScreen,
};

const AMATEUR_PLAYER_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  recrutement: AmateurClubScreen,
};

const PRO_PLAYER_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: ProPlayerCareerScreen,
  recrutement: ProPlayerOpportunitiesScreen,
  reels: ProPlayerPortfolioScreen,
  matchs: ProPlayerGroupScreen,
};

export function resolveMainTabScreen(
  tab: MainTabId,
  role?: UserRole | null,
  line?: ProductLineId | null,
): ComponentType {
  if (isMedicalPractitionerRole(role)) {
    return PHYSIO_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  if (role === 'supporter') {
    return SUPPORTER_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  if (isProProductLine(line ?? 'homme') && role === 'club') {
    return PRO_CLUB_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  if (isProProductLine(line ?? 'homme') && role === 'player') {
    return PRO_PLAYER_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  if (line === 'amateur' && role === 'player') {
    return AMATEUR_PLAYER_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  return DEFAULT_SCREENS[tab];
}

export function shouldInjectShopTab(role?: UserRole | null): boolean {
  return !isMedicalPractitionerRole(role) && !isSponsorRole(role);
}
