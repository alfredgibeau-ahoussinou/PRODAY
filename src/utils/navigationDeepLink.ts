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
export type DashboardDeepLink = 'sponsors' | 'feed' | 'gestion';
export type MatchsDeepLink = {
  eventId?: string;
  homeTab?: 'season' | 'matches' | 'convocations' | 'centre' | 'stats' | 'tournois';
  hubChapter?: 'apercu' | 'live' | 'composition' | 'stats' | 'effectif';
};

export type CarpoolDeepLink = {
  chapter?: 'evenements' | 'reserver' | 'proposer' | 'mes_trajets' | 'equipe';
  eventId?: string;
};

export interface TabNavigationActions {
  setActiveTab: (tab: MainTabId) => void;
  openTeamEvent: (eventId: string) => void;
  openMatchs: (opts?: { homeTab?: 'season' | 'matches' | 'convocations' | 'tournois' }) => void;
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
