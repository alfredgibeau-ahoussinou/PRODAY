/** États de charge / disponibilité déclarée (pas un diagnostic médical). */
export type HealthState =
  | 'OPTIMAL'
  | 'ACTIVE'
  | 'FATIGUED'
  | 'OVERLOADED'
  /** Conservé pour compat — afficher « Charge à surveiller », jamais un diagnostic. */
  | 'INJURY_RISK'
  | 'RECOVERY';

/** Niveau de prudence sur la charge (suivi opérationnel, pas prédiction de blessure). */
export type InjuryRiskLevel = 'low' | 'medium' | 'high';

export type LoadCautionLevel = InjuryRiskLevel;

export interface HealthSnapshot {
  state: HealthState;
  fatigueScore: number;
  recoveryScore: number;
  trainingLoad: number;
  /** Alias historique : prudence de charge, jamais un % de risque médical. */
  injuryRisk: InjuryRiskLevel;
  /** Même sens que injuryRisk — préférer ce libellé côté UI. */
  loadCaution: LoadCautionLevel;
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
