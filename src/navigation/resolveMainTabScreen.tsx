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
import { PhysioRequestsScreen } from '../screens/medical/PhysioRequestsScreen';
import { SupporterMatchsScreen } from '../screens/SupporterMatchsScreen';
import { SupporterSuivisScreen } from '../screens/SupporterSuivisScreen';
import { SupporterProfileTabScreen } from '../screens/SupporterProfileTabScreen';
import { ClubStructureScreen } from '../screens/ClubStructureScreen';
import { ClubRecruitmentScreen } from '../screens/club/ClubRecruitmentScreen';
import { ClubCalendarScreen } from '../screens/club/ClubCalendarScreen';
import { ClubCommunicationScreen } from '../screens/club/ClubCommunicationScreen';
import { ClubVitrineScreen } from '../screens/club/ClubVitrineScreen';
import { SupporterHomeScreen } from '../screens/supporter/SupporterHomeScreen';
import { SupporterTribuneFeedScreen } from '../screens/supporter/SupporterTribuneFeedScreen';
import { AmateurClubScreen } from '../screens/AmateurClubScreen';
import { ProPlayerCareerScreen } from '../screens/proPlayer/ProPlayerCareerScreen';
import { ProPlayerOpportunitiesScreen } from '../screens/proPlayer/ProPlayerOpportunitiesScreen';
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
  feed: PhysioRequestsScreen,
  messages: PhysioMessagesScreen,
  profil: PhysioProfileTabScreen,
};

const SUPPORTER_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: SupporterHomeScreen,
  matchs: SupporterMatchsScreen,
  feed: SupporterSuivisScreen,
  messages: SupporterTribuneFeedScreen,
  profil: SupporterProfileTabScreen,
};

const PRO_CLUB_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: ClubStructureScreen,
  recrutement: ClubRecruitmentScreen,
  matchs: ClubCalendarScreen,
  messages: ClubCommunicationScreen,
  profil: ClubVitrineScreen,
};

const AMATEUR_PLAYER_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  recrutement: AmateurClubScreen,
};

const PRO_PLAYER_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: ProPlayerCareerScreen,
  recrutement: ProPlayerOpportunitiesScreen,
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
  if (isProProductLine(line ?? 'pro_player') && role === 'club') {
    return PRO_CLUB_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  if (isProProductLine(line ?? 'pro_player') && role === 'player') {
    return PRO_PLAYER_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  if (line === 'amateur' && role === 'player') {
    return AMATEUR_PLAYER_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  return DEFAULT_SCREENS[tab];
}

/** Shop : supporter, amateur (joueur/coach) et pro joueur. */
export function shouldInjectShopTab(
  role?: UserRole | null,
  line?: ProductLineId | null,
): boolean {
  if (isMedicalPractitionerRole(role) || isSponsorRole(role)) return false;
  if (role === 'supporter' || line === 'supporter') return true;
  if (line === 'amateur' || line === 'homme' || line === 'woman') return true;
  if (role === 'player' && (line === 'pro_player' || isProProductLine(line ?? null))) {
    return true;
  }
  return false;
}
