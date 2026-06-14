import type { MainTabId } from '../../navigation/mainTabConfig';
import type { UserRole } from '../../models/User';
import type { HealthSnapshot } from './health';
import type { MatchRecommendation } from './recommendation';

export type ExpertId =
  | 'health'
  | 'performance'
  | 'geo'
  | 'product'
  | 'social'
  | 'notification'
  | 'ux'
  | 'ui'
  | 'growth'
  | 'data';

export type HeroIaState =
  | 'MATCH_RECOMMENDATION'
  | 'TRAINING_RECOMMENDATION'
  | 'REST_RECOMMENDATION'
  | 'SOCIAL_RECOMMENDATION';

export interface ExpertVote {
  expert: ExpertId;
  reason: string;
  weight: number;
  primaryTab?: MainTabId;
}

export interface AiCoreInput {
  userId: string;
  role: UserRole;
  globalScore: number;
  userEnergy: number;
  fatigueScore: number;
  healthState: HealthSnapshot['state'];
  nearbyMatchCount: number;
  unreadMessages: number;
  applicationsCount: number;
  upcomingEventsCount: number;
  streakDays: number;
  lastActiveHoursAgo: number;
  city?: string;
}

export interface AiCoreOutput {
  heroState: HeroIaState;
  heroTitle: string;
  heroDescription: string;
  primaryCta: { label: string; tab: MainTabId };
  secondaryCta?: { label: string; tab: MainTabId };
  dynamicScore: number;
  expertVotes: ExpertVote[];
  health: HealthSnapshot;
  matchRecommendations: MatchRecommendation[];
  contentFilter: {
    reelsUsefulnessMin: number;
    maxMatchIntensity: 'low' | 'medium' | 'high';
  };
  generatedAt: Date;
}
