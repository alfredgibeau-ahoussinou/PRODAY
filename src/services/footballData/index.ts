export type {
  FootballCompetitionEntry,
  FootballDataProvider,
  FootballMatchDetail,
  FootballMatchSource,
  FootballMatchStatistics,
  FootballTeamHit,
  ProDayFootballContext,
} from './types';

export {
  footballDataFacade,
  fetchMatchCenterData,
  resolveMatchCenterTabs,
  type MatchCenterData,
  type MatchCenterTabId,
} from './FootballDataFacade';

export {
  ExternalFootballDataProvider,
  ProDayFootballDataProvider,
  resetFootballStatsCache,
} from './providers';
