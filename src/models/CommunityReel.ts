import type { ReelThemeId } from '../content/reelThemes';

export type CommunityReelStatus = 'pending' | 'approved' | 'rejected';

export interface CommunityReel {
  id: string;
  author_uid: string;
  author_name: string;
  club_id?: string;
  video_url: string;
  poster_url?: string;
  caption: string;
  theme: Exclude<ReelThemeId, 'all'>;
  status: CommunityReelStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCommunityReelInput {
  caption: string;
  theme: Exclude<ReelThemeId, 'all'>;
  club_id?: string;
  video_url: string;
  poster_url?: string;
}
