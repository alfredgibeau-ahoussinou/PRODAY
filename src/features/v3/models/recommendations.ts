export type {
  MatchRecommendation,
  MatchFormat,
  RankedRecommendation,
  SmartActionRecommendation,
} from '../../../core/types/recommendation';

export interface Recommendation {
  id: string;
  title: string;
  subtitle: string;
  reason: string;
  score: number;
  tab: import('../../../navigation/mainTabConfig').MainTabId;
}
