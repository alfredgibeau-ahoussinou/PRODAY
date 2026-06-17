import { Platform } from 'react-native';

export interface WearableHealthMetrics {
  /** null = pas de donnée lue (≠ zéro pas réel). */
  stepsToday: number | null;
  sleepHoursLastNight: number | null;
  restingHeartRate: number | null;
  exerciseHeartRateAvg?: number | null;
  activeCaloriesToday?: number | null;
  distanceKmToday?: number | null;
  workoutDurationMin?: number | null;
  hrvMs?: number | null;
  syncedAt: string;
  source: 'apple_health' | 'google_health';
}

export interface WearableDailySnapshot {
  date: string;
  steps: number | null;
  sleepHours: number | null;
  restingHr: number | null;
  activeCalories: number | null;
  distanceKm: number | null;
}

export interface WearableRecoverySuggestion {
  id: string;
  title: string;
  body: string;
  priority: 'high' | 'medium' | 'low';
}

export type WearablePlatformLabel = 'Apple Santé' | 'Google Health' | 'Santé connectée';

export function getWearablePlatformLabel(): WearablePlatformLabel {
  if (Platform.OS === 'ios') return 'Apple Santé';
  if (Platform.OS === 'android') return 'Google Health';
  return 'Santé connectée';
}

export function isWearableHealthSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
