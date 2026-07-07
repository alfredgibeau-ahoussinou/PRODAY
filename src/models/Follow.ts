export type FollowTargetType = 'club' | 'tournament' | 'player';

export interface Follow {
  id: string;
  follower_uid: string;
  target_type: FollowTargetType;
  target_id: string;
  target_label?: string;
  created_at: Date;
  updated_at?: Date;
}

