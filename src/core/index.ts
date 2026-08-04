export { runAiCore } from './ai/aiCore.engine';
export { computeHealthSnapshot } from './health/healthState.engine';
export {
  buildMatchRecommendations,
  buildActionRecommendations,
  validateMatchJoin,
  rankScore,
} from './recommendation/recommendation.engine';
export {
  buildMercatoPostRecommendations,
  mercatoScoreMap,
  sortPostsByMercatoFit,
} from './recommendation/mercatoRecommendation.engine';
export type { MercatoPostRecommendation } from './recommendation/mercatoRecommendation.engine';
export { rankFeedPosts } from './recommendation/feedRanking.engine';
export { buildGeoMarkers, filterByRadius, summarizeDensity } from './geo/geoService';
export {
  buildNotificationCandidates,
  rankNotifications,
  scoreNotification,
} from './notifications/notificationPriority.engine';
export { mergeCalendarEntities, onMatchJoined } from './calendar/calendarSync.engine';
export { buildDeviceCalendarDrafts } from './calendar/deviceCalendar.mapper';
export type { DeviceCalendarEventDraft } from './calendar/deviceCalendar.mapper';
export { buildChatQuickReplies, type ChatQuickReply } from './social/chatQuickReply.engine';
export { computeProgression } from './gamification/progression.engine';
export { dispatchUserAction } from './actionDispatch';
export { userStateStore } from './state/userState.store';
export {
  toFirestoreDoc,
  fromFirestoreDoc,
  mergeProgression,
  BRAIN_STATE_VERSION,
} from './state/brainState.mapper';
export type { BrainPersistedState, BrainFirestoreDoc } from './state/brainState.mapper';
export { eventBus } from './events/eventBus';
export { trackV3Event } from './analytics/v3Events';

export type { AiCoreInput, AiCoreOutput, ExpertId, ExpertVote, HeroIaState } from './types/ai';
export type { HealthSnapshot, HealthState, HealthEngineInput } from './types/health';
export type {
  MatchRecommendation,
  MatchJoinValidation,
  MatchRecommendationInput,
  SmartActionRecommendation,
} from './types/recommendation';
export type { GeoMarker, GeoDensitySummary, GeoRadiusKm } from './types/geo';

/** Recruitment intelligence — Opportunity Score, Talent Radar, Smart Match. */
export {
  computeOpportunityScore,
  rankByOpportunityScore,
} from './recruitment/opportunityScore.engine';
export type {
  OpportunityScoreResult,
  OpportunityBand,
  OpportunityScoreBreakdown,
} from './recruitment/opportunityScore.engine';
export {
  buildTalentRadar,
  talentRadarTierLabel,
} from './recruitment/talentRadar.engine';
export type {
  TalentRadarHit,
  TalentRadarTier,
  TalentRadarSignals,
} from './recruitment/talentRadar.engine';
export {
  buildSmartMatchGraph,
  matchPlayersToPosts,
  matchPlayersToAgents,
  matchRecruitersToTalent,
} from './recruitment/smartMatch.engine';
export type { SmartMatchEdge, SmartMatchGraph, SmartMatchKind } from './recruitment/smartMatch.engine';
export {
  buildOneClickRecruitmentPlan,
  oneClickProgress,
} from './recruitment/oneClickRecruitment.engine';
export type {
  OneClickRecruitmentPlan,
  OneClickStep,
  OneClickStepId,
} from './recruitment/oneClickRecruitment.engine';
export {
  buildScoutReportDraft,
  averageAttributeRating,
  recommendFromOpportunityBand,
  isScoutReportComplete,
  emptyScoutAttributes,
} from './recruitment/scoutReport.engine';
export {
  filterPlayersAdvanced,
  playerMatchesAdvancedFilters,
  countActiveAdvancedFilters,
} from './recruitment/advancedPlayerSearch.engine';
export type { AdvancedPlayerSearchFilters } from './recruitment/advancedPlayerSearch.engine';
export {
  buildHighlightAnnotation,
  formatAnnotationTimestamp,
  sortAnnotations,
  annotationsForMedia,
} from './recruitment/highlightAnnotation.engine';
export type {
  HighlightAnnotation,
  HighlightAnnotationKind,
} from './recruitment/highlightAnnotation.engine';
export { buildCareerPathwayPlan } from './recruitment/careerPathway.engine';
export type {
  CareerPathwayKind,
  CareerPathwayPlan,
  CareerPathwayStep,
} from './recruitment/careerPathway.engine';
