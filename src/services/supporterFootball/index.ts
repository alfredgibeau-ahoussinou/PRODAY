export type {
  UnifiedMatch,
  UnifiedMatchSource,
  UnifiedMatchStatus,
  GenderScope,
  UnifiedTeamRef,
  UnifiedCompetitionRef,
  UnifiedScore,
  UnifiedLineupPlayer,
  UnifiedLineups,
  UnifiedMatchEvent,
  UnifiedStatistics,
  UnifiedStandingRow,
  FixtureQuery,
  SearchResult,
  ProviderHealth,
} from './types';

export type { SupporterFootballProvider } from './provider';
export { SportmonksFootballProvider } from './SportmonksFootballProvider';
export { ProDayFootballProvider } from './ProDayFootballProvider';
export { DemoFootballProvider } from './DemoFootballProvider';
export { EmptyFootballProvider } from './EmptyFootballProvider';
export {
  MergedSupporterFootballFacade,
  createSupporterFootballFacade,
  resolveMatchCenterTabs,
  filterMatchesForFollows,
  rejectDemoUnlessForced,
  supporterFootballFacade,
  type MatchCenterTabId,
  type MatchCenterPayload,
} from './MergedSupporterFootballFacade';
export {
  mapSmFixtureToUnified,
  mapSmStatus,
  inferGenderScope,
  parseFormationField,
} from './mappers';
export {
  FIXTURE_DETAIL_INCLUDES,
  FIXTURE_LIST_INCLUDES,
  LIVE_INPLAY_INCLUDES,
} from './SportmonksFootballProvider';
export {
  isSportmonksTokenConfigured,
  isSupporterFootballDemoForced,
  clearSportmonksCache,
} from './sportmonksClient';
