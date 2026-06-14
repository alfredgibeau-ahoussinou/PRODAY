export type BadgeId =
  | 'first_steps'
  | 'profile_complete'
  | 'mercato_active'
  | 'match_ready'
  | 'health_mindful'
  | 'social_spark'
  | 'streak_7'
  | 'elite_pulse';

export interface Badge {
  id: BadgeId;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface GamificationState {
  xp: number;
  level: number;
  xpToNext: number;
  xpProgress: number;
  streakDays: number;
  badges: Badge[];
  rankLabel: string;
}
