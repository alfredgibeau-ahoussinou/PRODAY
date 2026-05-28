import type { AppSpaceId } from './AppSpace';

export type StageOfferStatus = 'OPEN' | 'CLOSED';
export type StageApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WAITLIST';

export interface StageOffer {
  id: string;
  author_uid: string;
  club_id: string;
  club_name: string;
  title: string;
  description: string;
  city: string;
  category: string;
  start_date: Date;
  end_date: Date;
  price_eur?: number;
  spots_total: number;
  spots_taken: number;
  status: StageOfferStatus;
  target_space?: AppSpaceId;
  created_at: Date;
}

export interface StageApplication {
  id: string;
  stage_id: string;
  stage_author_uid?: string;
  player_uid: string;
  player_name: string;
  message: string;
  status: StageApplicationStatus;
  created_at: Date;
}
