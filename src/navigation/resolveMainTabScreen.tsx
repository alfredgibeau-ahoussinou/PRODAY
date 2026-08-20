import type { ComponentType } from 'react';
import type { MainTabId } from './mainTabConfig';
import type { ProductLineId } from '../models/ProductLine';
import { isProProductLine } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import { isJoueurPoleProductLine } from '../utils/joueurPoleAccess';
import { isSponsorRole } from '../content/sponsorExperience';
import { isRetiredUserRole } from '../utils/retiredRoles';
import { HomeScreen } from '../screens/HomeScreen';
import { MercatoScreen } from '../screens/MercatoScreen';
import { MatchsScreen } from '../screens/MatchsScreen';
import { CarpoolScreen } from '../screens/CarpoolScreen';
import { FamilleTabScreen } from '../screens/FamilleTabScreen';
import { FeedTabScreen } from '../screens/FeedTabScreen';
import { LazyReelsScreen } from '../screens/LazyReelsScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ProfilTabScreen } from '../screens/ProfilTabScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { RetiredRoleScreen } from '../screens/RetiredRoleScreen';
import { ClubPortalScreen } from '../screens/club/ClubPortalScreen';
import { CoachPortalScreen } from '../screens/coach/CoachPortalScreen';
import { ClubRecruitmentScreen } from '../screens/club/ClubRecruitmentScreen';
import { ClubCalendarScreen } from '../screens/club/ClubCalendarScreen';
import { ClubCommunicationScreen } from '../screens/club/ClubCommunicationScreen';
import { ClubVitrineScreen } from '../screens/club/ClubVitrineScreen';
import { FootballHubHomeScreen } from '../screens/footballHub/FootballHubHomeScreen';
import { FootballHubMatchsScreen } from '../screens/footballHub/FootballHubMatchsScreen';
import { FootballHubProDayScreen } from '../screens/footballHub/FootballHubProDayScreen';
import { FootballHubFavoritesScreen } from '../screens/footballHub/FootballHubFavoritesScreen';
import { FootballHubProfileScreen } from '../screens/footballHub/FootballHubProfileScreen';
import { FootballHubDebateFeedScreen } from '../screens/footballHub/FootballHubDebateFeedScreen';
import { SupporterVideosScreen } from '../screens/supporter/SupporterVideosScreen';
import { AmateurClubScreen } from '../screens/AmateurClubScreen';
import { ProPlayerSquadScreen } from '../screens/proPlayer/ProPlayerSquadScreen';
import { SmartTacticsPortalScreen } from '../screens/smartTactics/SmartTacticsPortalScreen';
import { PlayerFootballHubScreen } from '../screens/joueur/PlayerFootballHubScreen';
import { PlayerProgressionScreen } from '../screens/joueur/PlayerProgressionScreen';
import { PlayerSaisonScreen } from '../screens/joueur/PlayerSaisonScreen';
import { JoueurPlusHubScreen } from '../screens/joueur/JoueurPlusHubScreen';

const DEFAULT_SCREENS: Record<MainTabId, ComponentType> = {
  home: HomeScreen,
  recrutement: MercatoScreen,
  matchs: MatchsScreen,
  covoiturage: CarpoolScreen,
  sante: RetiredRoleScreen,
  feed: FeedTabScreen,
  progression: RetiredRoleScreen,
  reels: LazyReelsScreen,
  famille: FamilleTabScreen,
  messages: MessagesScreen,
  profil: ProfilTabScreen,
  shop: ShopScreen,
  plus: JoueurPlusHubScreen,
};

const SUPPORTER_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: FootballHubHomeScreen,
  matchs: FootballHubMatchsScreen,
  feed: FootballHubProDayScreen,
  plus: FootballHubFavoritesScreen,
  profil: FootballHubProfileScreen,
  /** Secondaires hors dock — accessibles via Accueil / Match Center. */
  reels: SupporterVideosScreen,
  messages: FootballHubDebateFeedScreen,
  shop: ShopScreen,
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
  home: PlayerFootballHubScreen,
  feed: PlayerSaisonScreen,
  progression: PlayerProgressionScreen,
  recrutement: AmateurClubScreen,
  plus: JoueurPlusHubScreen,
};

const PRO_PLAYER_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: PlayerFootballHubScreen,
  feed: PlayerSaisonScreen,
  progression: PlayerProgressionScreen,
  recrutement: ProPlayerSquadScreen,
  plus: JoueurPlusHubScreen,
};

export function resolveMainTabScreen(
  tab: MainTabId,
  role?: UserRole | null,
  line?: ProductLineId | null,
): ComponentType {
  if (isRetiredUserRole(role) || line === 'sante') {
    return RetiredRoleScreen;
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
  if (
    role === 'player' &&
    line != null &&
    isJoueurPoleProductLine(line) &&
    line !== 'pro_player'
  ) {
    return AMATEUR_PLAYER_SCREENS[tab] ?? DEFAULT_SCREENS[tab];
  }
  return DEFAULT_SCREENS[tab];
}

/** Shop : tous les pôles sauf sponsor marque / rôles retirés. */
export function shouldInjectShopTab(
  role?: UserRole | null,
  line?: ProductLineId | null,
): boolean {
  if (isRetiredUserRole(role) || line === 'sante') return false;
  if (isSponsorRole(role)) return false;
  if (role === 'supporter' || line === 'supporter') return false;
  if (line === 'amateur' || line === 'homme' || line === 'woman') return true;
  if (
    role === 'player' ||
    role === 'club' ||
    role === 'coach' ||
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
