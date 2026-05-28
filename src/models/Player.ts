import type { GeoPoint } from './User';
import type { AppSpaceId } from './AppSpace';

export interface RecruitmentPost {
  id: string;
  author_uid?: string;
  club_id: string;
  club_name: string;
  title: string;
  position: string;
  category: string;
  level: string;
  city: string;
  location?: GeoPoint;
  description: string;
  created_at: Date;
  status: 'OPEN' | 'CLOSED';
  /** Espace cible : féminin, masculin, jeunes, -13 */
  target_space?: AppSpaceId;
}

export interface Application {
  id: string;
  post_id: string;
  post_author_uid?: string;
  player_uid: string;
  player_name?: string;
  cover_letter: string;
  cv_pdf_url: string;
  created_at: Date;
  updated_at?: Date;
  status: 'PENDING' | 'VIEWED' | 'ACCEPTED' | 'REJECTED';
  rejection_reason?: string;
}

export interface RecruitmentFilters {
  position?: string;
  category?: string;
  level?: string;
  max_distance_km?: number;
  city?: string;
}
