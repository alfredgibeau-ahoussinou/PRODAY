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
