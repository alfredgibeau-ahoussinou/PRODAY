import type { MainTabId } from '../navigation/mainTabConfig';
import type { SeasonCalendarItem } from './seasonCalendar';

export type MercatoDeepLink =
  | 'home'
  | 'detections'
  | 'create_post'
  | 'stages'
  | 'players'
  | 'favorites'
  | 'talent_radar'
  | 'compare';
export type ProfileDeepLink = 'applications' | 'cv';
export type DashboardDeepLink =
  | 'sponsors'
  | 'feed'
  | 'gestion'
  | 'smart_tactics'
  | 'train'
  | 'train_ai'
  | 'train_coach'
  | 'tactics_coach';
export type MatchsDeepLink = {
  eventId?: string;
  homeTab?: 'season' | 'matches' | 'convocations' | 'centre' | 'stats' | 'tournois' | 'competitions';
  hubChapter?: 'apercu' | 'live' | 'composition' | 'stats' | 'effectif';
  /** Ouvre directement Matchs à organiser / proposer / chercher. */
  view?: 'organize' | 'propose' | 'search';
};

export type CarpoolDeepLink = {
  chapter?: 'evenements' | 'reserver' | 'proposer' | 'mes_trajets' | 'equipe';
  eventId?: string;
};

export type SetActiveTabOptions = {
  returnTo?: MainTabId;
};

/** Calcule returnTab : explicite > retour dock > conserver l’existant. */
export function resolveAutoReturnTab(
  fromTab: MainTabId,
  toTab: MainTabId,
  primaryDockTabs: ReadonlySet<MainTabId>,
  explicitReturnTo?: MainTabId,
): MainTabId | null | undefined {
  if (explicitReturnTo !== undefined) return explicitReturnTo;
  if (primaryDockTabs.has(toTab)) return null;
  if (primaryDockTabs.has(fromTab) && !primaryDockTabs.has(toTab)) return fromTab;
  return undefined;
}

export interface TabNavigationActions {
  setActiveTab: (tab: MainTabId, options?: SetActiveTabOptions) => void;
  goBackTab: () => void;
  openTeamEvent: (eventId: string) => void;
  openMatchs: (opts?: MatchsDeepLink) => void;
  openMercato: (view?: MercatoDeepLink) => void;
  openProfile: (view?: ProfileDeepLink) => void;
  openDashboard: (view: DashboardDeepLink) => void;
  openShop: () => void;
  openCarpool: (opts?: CarpoolDeepLink) => void;
}

/** Ouvre la bonne cible selon le type d’entrée calendrier. */
export function openSeasonCalendarItem(
  item: SeasonCalendarItem,
  nav: TabNavigationActions
): void {
  if (item.team_event_id) {
    nav.openTeamEvent(item.team_event_id);
    return;
  }
  if (item.friendly_match_id) {
    nav.openMatchs({ homeTab: 'matches' });
    return;
  }
  nav.openMatchs({ homeTab: 'season' });
}
