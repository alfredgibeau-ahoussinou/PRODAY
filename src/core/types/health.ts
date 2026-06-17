/** États santé (spec §7.3). */
export type HealthState =
  | 'OPTIMAL'
  | 'ACTIVE'
  | 'FATIGUED'
  | 'OVERLOADED'
  | 'INJURY_RISK'
  | 'RECOVERY';

export type InjuryRiskLevel = 'low' | 'medium' | 'high';

export interface HealthSnapshot {
  state: HealthState;
  fatigueScore: number;
  recoveryScore: number;
  trainingLoad: number;
  injuryRisk: InjuryRiskLevel;
  allowIntenseMatch: boolean;
  dailyPlanHint: string;
  coachMessage: string;
}

export interface HealthEngineInput {
  globalScore: number;
  upcomingEventsCount: number;
  pendingConvocations: number;
  recentMatchCount: number;
  streakDays: number;
  profileCompletion: number;
  /** Données Apple Santé / Google Health (optionnel). */
  sleepHoursLastNight?: number;
  stepsToday?: number;
  restingHeartRate?: number;
  wearableConnected?: boolean;
}
