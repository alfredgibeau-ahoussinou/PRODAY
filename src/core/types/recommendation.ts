import type { GeoPoint } from '../../models/User';
import type { MainTabId } from '../../navigation/mainTabConfig';
import type { HealthSnapshot } from './health';

export type MatchFormat = '5v5' | '7v7' | '11v11' | 'futsal' | 'unknown';

export interface MatchRecommendation {
  id: string;
  title: string;
  subtitle: string;
  city: string;
  startsAt: Date;
  distanceKm: number | null;
  level: string;
  format: MatchFormat;
  iaScore: number;
  iaLevelScore: number;
  healthCompatible: boolean;
  tab: MainTabId;
  entityId: string;
  location?: GeoPoint;
}

export interface RankedRecommendation {
  id: string;
  kind: 'match' | 'player' | 'content' | 'action';
  title: string;
  score: number;
  tab: MainTabId;
}

export interface SmartActionRecommendation {
  id: string;
  label: string;
  reason: string;
  priority: number;
  tab: MainTabId;
}

export interface MatchJoinValidation {
  allowed: boolean;
  reasons: string[];
}

export interface MatchRecommendationInput {
  openMatches: {
    id: string;
    requester_club_name: string;
    opponent_club_name?: string;
    city: string;
    date: Date;
    level: string;
    level_type: string;
    location?: GeoPoint;
  }[];
  calendarItems: { id: string; starts_at: Date }[];
  userLocation?: GeoPoint;
  userLevel?: string;
  health: HealthSnapshot;
  radiusKm?: number;
}
