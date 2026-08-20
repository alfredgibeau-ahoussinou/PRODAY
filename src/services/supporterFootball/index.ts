export type {
  UnifiedMatch,
  UnifiedMatchSource,
  UnifiedMatchStatus,
  GenderScope,
  UnifiedTeamRef,
  UnifiedCompetitionRef,
  UnifiedScore,
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
export {
  MergedSupporterFootballFacade,
  createSupporterFootballFacade,
  resolveMatchCenterTabs,
  filterMatchesForFollows,
  supporterFootballFacade,
  type MatchCenterTabId,
  type MatchCenterPayload,
} from './MergedSupporterFootballFacade';
export { mapSmFixtureToUnified, mapSmStatus, inferGenderScope } from './mappers';export {
  isSportmonksTokenConfigured,
  isSupporterFootballDemoForced,
  clearSportmonksCache,
} from './sportmonksClient';
