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
import { ClubPortalScreen } from '../screens/club/ClubPortalScreen';
import { CoachPortalScreen } from '../screens/coach/CoachPortalScreen';
import { ClubRecruitmentScreen } from '../screens/club/ClubRecruitmentScreen';
import { ClubCalendarScreen } from '../screens/club/ClubCalendarScreen';
import { ClubCommunicationScreen } from '../screens/club/ClubCommunicationScreen';
import { ClubVitrineScreen } from '../screens/club/ClubVitrineScreen';
import { SupporterHomeScreen } from '../screens/supporter/SupporterHomeScreen';
import { SupporterTribuneFeedScreen } from '../screens/supporter/SupporterTribuneFeedScreen';
import { AmateurClubScreen } from '../screens/AmateurClubScreen';
import { ProPlayerSquadScreen } from '../screens/proPlayer/ProPlayerSquadScreen';
import { SmartTacticsPortalScreen } from '../screens/smartTactics/SmartTacticsPortalScreen';

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
  home: ClubPortalScreen,
  recrutement: ClubRecruitmentScreen,
  matchs: ClubCalendarScreen,
  messages: ClubCommunicationScreen,
  profil: ClubVitrineScreen,
};

const AMATEUR_CLUB_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: ClubPortalScreen,
  recrutement: ClubRecruitmentScreen,
  matchs: ClubCalendarScreen,
  feed: SmartTacticsPortalScreen,
  messages: ClubCommunicationScreen,
  profil: ClubVitrineScreen,
};

const COACH_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: CoachPortalScreen,
  feed: SmartTacticsPortalScreen,
};

const AMATEUR_PLAYER_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  recrutement: AmateurClubScreen,
  feed: SmartTacticsPortalScreen,
};

const PRO_PLAYER_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  // home → DEFAULT HomeScreen → JoueurAdaptiveHome
  recrutement: ProPlayerSquadScreen,
  feed: SmartTacticsPortalScreen,
  // matchs → DEFAULT MatchsScreen (hub match, pas le groupe)
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
  if (line === 'amateur' && role === 'club') {
    return AMATEUR_CLUB_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  if (isProProductLine(line ?? 'pro_player') && role === 'club') {
    return PRO_CLUB_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  if (isProProductLine(line ?? 'pro_player') && role === 'player') {
    return PRO_PLAYER_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  if (role === 'coach') {
    return COACH_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  if (line === 'amateur' && role === 'player') {
    return AMATEUR_PLAYER_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  return DEFAULT_SCREENS[tab];
}

/** Shop : tous les pôles sauf Santé (praticien) et sponsor marque. */
export function shouldInjectShopTab(
  role?: UserRole | null,
  line?: ProductLineId | null,
): boolean {
  if (isMedicalPractitionerRole(role) || line === 'sante') return false;
  if (isSponsorRole(role)) return false;
  if (role === 'supporter' || line === 'supporter') return false;
  if (line === 'amateur' || line === 'homme' || line === 'woman') return true;
  if (
    role === 'player' ||
    role === 'club' ||
    role === 'coach' ||
    role === 'agent' ||
    role === 'recruiter' ||
    role === 'organizer'
  ) {
    return (
      line === 'pro_player' ||
      line === 'pro_club' ||
      line === 'pro_staff' ||
      (line != null && isProProductLine(line))
    );
  }
  return false;
}
