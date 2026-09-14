import type { ComponentType } from 'react';
import type { MainTabId } from './mainTabConfig';
import type { ProductLineId } from '../models/ProductLine';
import { isProProductLine } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import { isJoueurPoleProductLine } from '../utils/joueurPoleAccess';
import { isSponsorRole } from '../content/sponsorExperience';
import { isRetiredUserRole } from '../utils/retiredRoles';
import { PlayerHomeScreenV4 } from '../screens/joueur/PlayerHomeScreenV4';
import { PlayerCalendarScreenV4 } from '../screens/joueur/PlayerCalendarScreenV4';
import { PlayerMyCardScreenV4 } from '../screens/joueur/PlayerMyCardScreenV4';
import { CoachHomeScreen } from '../screens/coach/CoachHomeScreen';
import { CoachTrainingPlannerScreen } from '../screens/coach/CoachTrainingPlannerScreen';
import { CoachSquadScreen } from '../screens/coach/CoachSquadScreen';
import { CoachDynamicTacticsScreenV4 } from '../screens/coach/CoachDynamicTacticsScreenV4';
import { ClubTeamsScreen } from '../screens/club/ClubTeamsScreen';
import { ClubMatchesScreen } from '../screens/club/ClubMatchesScreen';
import { MercatoScreen } from '../screens/MercatoScreen';
import { CarpoolScreen } from '../screens/CarpoolScreen';
import { FamilleTabScreen } from '../screens/FamilleTabScreen';
import { FeedTabScreen } from '../screens/FeedTabScreen';
import { LazyReelsScreen } from '../screens/LazyReelsScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { RetiredRoleScreen } from '../screens/RetiredRoleScreen';
import { ClubHomeScreen } from '../screens/club/ClubHomeScreen';
import { ClubCommunicationScreen } from '../screens/club/ClubCommunicationScreen';
import { ClubHubScreen } from '../screens/club/ClubHubScreen';
import { SupporterHomeScreen } from '../screens/supporter/SupporterHomeScreen';
import { SupporterMatchsScreen } from '../screens/supporter/SupporterMatchsScreen';
import { SupporterCompetitionsScreen } from '../screens/supporter/SupporterCompetitionsScreen';
import { SupporterClubsScreen } from '../screens/supporter/SupporterClubsScreen';
import { SupporterVideosScreen } from '../screens/supporter/SupporterVideosScreen';
import { SupporterProfileScreen } from '../screens/supporter/SupporterProfileScreen';
import { AmateurClubScreen } from '../screens/AmateurClubScreen';
import { ProPlayerSquadScreen } from '../screens/proPlayer/ProPlayerSquadScreen';
import { PlayerProgressionScreen } from '../screens/joueur/PlayerProgressionScreen';
import { PlayerSaisonScreen } from '../screens/joueur/PlayerSaisonScreen';
import { ProDayMenuScreen } from '../screens/menu/ProDayMenuScreen';

const DEFAULT_SCREENS: Record<MainTabId, ComponentType> = {
  home: PlayerHomeScreenV4,
  recrutement: MercatoScreen,
  matchs: PlayerCalendarScreenV4,
  covoiturage: CarpoolScreen,
  sante: RetiredRoleScreen,
  feed: FeedTabScreen,
  progression: PlayerProgressionScreen,
  reels: LazyReelsScreen,
  famille: FamilleTabScreen,
  messages: MessagesScreen,
  profil: PlayerMyCardScreenV4,
  shop: ShopScreen,
  plus: ProDayMenuScreen,
};

/** Dock : Accueil · Matchs · Compétitions · Mes clubs · Vidéos · Profil. */
const SUPPORTER_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: SupporterHomeScreen,
  matchs: SupporterMatchsScreen,
  feed: SupporterCompetitionsScreen,
  plus: SupporterClubsScreen,
  reels: SupporterVideosScreen,
  profil: SupporterProfileScreen,
};

const PRO_CLUB_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: ClubHomeScreen,
  recrutement: ClubTeamsScreen,
  matchs: ClubMatchesScreen,
  messages: ClubCommunicationScreen,
  profil: ClubHubScreen,
  plus: ProDayMenuScreen,
};

const AMATEUR_CLUB_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: ClubHomeScreen,
  recrutement: ClubTeamsScreen,
  matchs: ClubMatchesScreen,
  feed: CoachDynamicTacticsScreenV4,
  messages: ClubCommunicationScreen,
  profil: ClubHubScreen,
  plus: ProDayMenuScreen,
};

const COACH_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: CoachHomeScreen,
  matchs: CoachTrainingPlannerScreen,
  recrutement: CoachSquadScreen,
  feed: CoachDynamicTacticsScreenV4,
  plus: ProDayMenuScreen,
};

const AMATEUR_PLAYER_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: PlayerHomeScreenV4,
  feed: PlayerSaisonScreen,
  progression: PlayerProgressionScreen,
  recrutement: AmateurClubScreen,
  matchs: PlayerCalendarScreenV4,
  profil: PlayerMyCardScreenV4,
  plus: ProDayMenuScreen,
};

const PRO_PLAYER_SCREENS: Partial<Record<MainTabId, ComponentType>> = {
  home: PlayerHomeScreenV4,
  feed: PlayerSaisonScreen,
  progression: PlayerProgressionScreen,
  recrutement: ProPlayerSquadScreen,
  matchs: PlayerCalendarScreenV4,
  profil: PlayerMyCardScreenV4,
  plus: ProDayMenuScreen,
};

export function resolveMainTabScreen(
  tab: MainTabId,
  role?: UserRole | null,
  line?: ProductLineId | null,
): ComponentType {
  // Invité anonyme : toujours Home/Discover + Auth (ProfilTab) — jamais scaffold
  // supporter / retired, sinon « espace à venir » / écran noir sans retour.
  if (role == null) {
    return DEFAULT_SCREENS[tab];
  }
  if (isRetiredUserRole(role) || line === 'sante') {
    return RetiredRoleScreen;
  }
  // Scaffold supporter : rôle supporter OU parent en visite invitée (line supporter).
  if (role === 'supporter' || (role === 'parent' && line === 'supporter')) {
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
    role === 'coach'
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
