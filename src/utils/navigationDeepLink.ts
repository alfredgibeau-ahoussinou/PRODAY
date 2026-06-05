import type { MainTabId } from '../navigation/mainTabConfig';
import type { SeasonCalendarItem } from './seasonCalendar';

export type MercatoDeepLink = 'detections' | 'create_post' | 'stages';
export type ProfileDeepLink = 'applications' | 'cv';
export type DashboardDeepLink = 'arena' | 'sponsors' | 'feed';
export type MatchsDeepLink = { eventId?: string; homeTab?: 'season' | 'matches' };

export interface TabNavigationActions {
  setActiveTab: (tab: MainTabId) => void;
  openTeamEvent: (eventId: string) => void;
  openMatchs: (opts?: { homeTab?: 'season' | 'matches' }) => void;
  openMercato: (view: MercatoDeepLink) => void;
  openProfile: (view?: ProfileDeepLink) => void;
  openDashboard: (view: DashboardDeepLink) => void;
  openArenaTournament: (tournamentId: string) => void;
  openShop: () => void;
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
  if (item.tournament_id) {
    nav.setActiveTab('home');
    nav.openDashboard('arena');
    nav.openArenaTournament(item.tournament_id);
    return;
  }
  nav.openMatchs({ homeTab: 'season' });
}
