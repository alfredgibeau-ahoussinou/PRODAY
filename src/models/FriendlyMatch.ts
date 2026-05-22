import type { GeoPoint } from './User';

export type FriendlyMatchStatus = 'OPEN' | 'ACCEPTED' | 'PLAYED' | 'CANCELLED';

export interface FriendlyMatch {
  id: string;
  requester_uid?: string;
  requester_club_id: string;
  requester_club_name: string;
  opponent_club_id?: string;
  opponent_club_name?: string;
  location?: GeoPoint;
  city: string;
  date: Date;
  time_label?: string;
  category: string;
  level: string;
  level_type: 'loisir' | 'competition' | 'mixte';
  has_pitch: boolean;
  message?: string;
  status: FriendlyMatchStatus;
  created_at: Date;
}

export interface CreateFriendlyMatchInput {
  requester_uid: string;
  requester_club_id: string;
  requester_club_name: string;
  opponent_club_name?: string;
  city: string;
  date: Date;
  time_label: string;
  category: string;
  level: string;
  level_type: 'loisir' | 'competition' | 'mixte';
  message?: string;
}
