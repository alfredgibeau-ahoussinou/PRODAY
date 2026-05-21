import type { GeoPoint } from './User';

export interface RecruitmentPost {
  id: string;
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
}

export interface Application {
  id: string;
  post_id: string;
  player_uid: string;
  cover_letter: string;
  cv_pdf_url: string;
  created_at: Date;
  status: 'PENDING' | 'VIEWED' | 'ACCEPTED' | 'REJECTED';
}

export interface RecruitmentFilters {
  position?: string;
  category?: string;
  level?: string;
  max_distance_km?: number;
  city?: string;
}
