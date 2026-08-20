import type { Follow } from '../../models/Follow';
import type { TeamEvent } from '../../models/TeamEvent';
import type { Tournament } from '../../models/Tournament';
import type { ExternalFixture } from '../externalScores.types';
import { fetchSupporterMatchHub } from '../supporterMatchHub.service';
import type { SupporterMatchFilters } from '../supporterPreferences.service';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { externalScoresService } from '../externalScores.service';
import {
  ExternalFootballDataProvider,
  ProDayFootballDataProvider,
} from './providers';
import type {
  FootballCompetitionEntry,
  FootballMatchDetail,
  FootballMatchStatistics,
  FootballTeamHit,
} from './types';

export interface MatchCenterData extends FootballMatchDetail {
  availableTabs: MatchCenterTabId[];
}

export type MatchCenterTabId =
  | 'resume'
  | 'live'
  | 'stats'
  | 'video'
  | 'analyse'
  | 'moments';

const externalProvider = new ExternalFootballDataProvider();

export function resolveMatchCenterTabs(detail: FootballMatchDetail, hasVideo: boolean): MatchCenterTabId[] {
  const tabs: MatchCenterTabId[] = ['resume'];
  if (detail.item.status === 'live' || detail.events.length > 0) tabs.push('live');
  // Stats toujours proposées pour le monde — message honnête si l’API ne renvoie rien.
  if (detail.source === 'world' || detail.statistics) tabs.push('stats');
  if (hasVideo) tabs.push('video');
  tabs.push('analyse');
  if (detail.events.length > 0) tabs.push('moments');
  return tabs;
}

export async function fetchMatchCenterData(
  matchId: string,
  context?: {
    calendarEvents?: TeamEvent[];
    tournaments?: Tournament[];
    seedItem?: SupporterMatchViewItem;
  },
): Promise<MatchCenterData | null> {
  const proday = new ProDayFootballDataProvider(
    context?.calendarEvents ?? [],
    context?.tournaments ?? [],
  );
  const detail =
    (await proday.getMatchDetail(matchId)) ??
    (await externalProvider.getMatchDetail(matchId, context?.seedItem ?? null));
  if (!detail) return null;

  const hasVideo = Boolean(detail.prodayEvent?.public_watch_url?.trim());
  return {
    ...detail,
    availableTabs: resolveMatchCenterTabs(detail, hasVideo),
  };
}

export const footballDataFacade = {
  async listLiveFixtures(): Promise<ExternalFixture[]> {
    return externalProvider.listLiveFixtures();
  },

  async listUpcomingFixtures(days = 14, leagueIds?: number[]): Promise<ExternalFixture[]> {
    return externalProvider.listUpcomingFixtures(days, leagueIds);
  },

  async searchTeams(query: string): Promise<FootballTeamHit[]> {
    const [world, proday] = await Promise.all([
      externalProvider.searchTeams(query),
      new ProDayFootballDataProvider([], []).searchTeams(query),
    ]);
    const seen = new Set<string>();
    return [...world, ...proday].filter((h) => {
      const key = h.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 16);
  },

  async searchClubs(query: string): Promise<FootballTeamHit[]> {
    return this.searchTeams(query);
  },

  async getMatchDetail(matchId: string, context?: Parameters<typeof fetchMatchCenterData>[1]) {
    return fetchMatchCenterData(matchId, context);
  },

  fetchMatchCenterData,

  async getFixtureStatistics(fixtureId: string): Promise<FootballMatchStatistics | null> {
    return externalProvider.getFixtureStatistics(fixtureId);
  },

  async listCompetitionsByCountry(countryCode?: string): Promise<FootballCompetitionEntry[]> {
    return externalProvider.listCompetitionsByCountry(countryCode);
  },

  async fetchHub(params: {
    calendarEvents: TeamEvent[];
    tournaments: Tournament[];
    follows: Follow[];
    filters: SupporterMatchFilters;
  }) {
    return fetchSupporterMatchHub(params);
  },

  async getProviderState() {
    return externalProvider.getProviderState();
  },
};

export { ExternalFootballDataProvider, ProDayFootballDataProvider };
