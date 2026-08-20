import type { Follow } from '../../models/Follow';
import type { TeamEvent } from '../../models/TeamEvent';
import type { Tournament } from '../../models/Tournament';
import type { ExternalFixture } from '../externalScores.types';
import { fetchSupporterMatchHub } from '../supporterMatchHub.service';
import type { SupporterMatchFilters } from '../supporterPreferences.service';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import {
  ExternalFootballDataProvider,
  MergedFootballProvider,
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
  | 'compositions'
  | 'events'
  | 'video'
  | 'analyse'
  | 'moments';

const externalProvider = new ExternalFootballDataProvider();

function createMerged(
  calendarEvents: TeamEvent[] = [],
  tournaments: Tournament[] = [],
): MergedFootballProvider {
  return new MergedFootballProvider(
    new ProDayFootballDataProvider(calendarEvents, tournaments),
    externalProvider,
  );
}

export function resolveMatchCenterTabs(detail: FootballMatchDetail, hasVideo: boolean): MatchCenterTabId[] {
  const tabs: MatchCenterTabId[] = ['resume'];
  if (detail.statistics || detail.source === 'world') tabs.push('stats');
  /** Toujours proposé — empty state honnête si l’API n’a pas publié le XI. */
  tabs.push('compositions');
  if (detail.events.length > 0 || detail.item.status === 'live') tabs.push('events');
  if (hasVideo) tabs.push('video');
  if (detail.source === 'proday') tabs.push('analyse');
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
  const merged = createMerged(context?.calendarEvents ?? [], context?.tournaments ?? []);
  const detail = await merged.getMatchDetail(matchId, context?.seedItem ?? null);
  if (!detail) return null;

  const hasVideo = Boolean(detail.prodayEvent?.public_watch_url?.trim());
  return {
    ...detail,
    availableTabs: resolveMatchCenterTabs(detail, hasVideo),
  };
}

/** Facade unique — UI Football Hub : jamais d’appel API brut. */
export const footballDataFacade = {
  async listLiveFixtures(): Promise<ExternalFixture[]> {
    return createMerged().listLiveFixtures();
  },

  async listUpcomingFixtures(days = 14, leagueIds?: number[]): Promise<ExternalFixture[]> {
    return createMerged().listUpcomingFixtures(days, leagueIds);
  },

  async getFixtures(opts?: { live?: boolean; days?: number; leagueIds?: number[] }) {
    return createMerged().getFixtures(opts);
  },

  async getFixture(fixtureId: string): Promise<ExternalFixture | null> {
    return createMerged().getFixture(fixtureId);
  },

  async getLineups(fixtureId: string) {
    return createMerged().getLineups(fixtureId);
  },

  async getEvents(fixtureId: string) {
    return createMerged().getEvents(fixtureId);
  },

  async getStatistics(fixtureId: string): Promise<FootballMatchStatistics | null> {
    return createMerged().getStatistics(fixtureId);
  },

  async searchTeams(query: string): Promise<FootballTeamHit[]> {
    return (await createMerged().searchTeams(query)).slice(0, 16);
  },

  async searchClubs(query: string): Promise<FootballTeamHit[]> {
    return this.searchTeams(query);
  },

  async getMatchDetail(matchId: string, context?: Parameters<typeof fetchMatchCenterData>[1]) {
    return fetchMatchCenterData(matchId, context);
  },

  fetchMatchCenterData,

  async getFixtureStatistics(fixtureId: string): Promise<FootballMatchStatistics | null> {
    return createMerged().getFixtureStatistics(fixtureId);
  },

  async listCompetitionsByCountry(countryCode?: string): Promise<FootballCompetitionEntry[]> {
    return createMerged().listCompetitionsByCountry(countryCode);
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
    return createMerged().getProviderState();
  },

  createMerged,
};

export {
  ExternalFootballDataProvider,
  MergedFootballProvider,
  ProDayFootballDataProvider,
};
