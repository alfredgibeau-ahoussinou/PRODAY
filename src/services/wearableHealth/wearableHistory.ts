import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WearableDailySnapshot, WearableHealthMetrics } from './types';

const STORAGE_KEY = '@proday/wearable_history_v1';
const MAX_DAYS = 30;

function dayKey(date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

function snapshotFromMetrics(metrics: WearableHealthMetrics): WearableDailySnapshot {
  return {
    date: dayKey(),
    steps: metrics.stepsToday,
    sleepHours: metrics.sleepHoursLastNight,
    restingHr: metrics.restingHeartRate,
    activeCalories: metrics.activeCaloriesToday ?? null,
    distanceKm: metrics.distanceKmToday ?? null,
  };
}

export const wearableHistoryService = {
  async append(metrics: WearableHealthMetrics): Promise<WearableDailySnapshot[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const list: WearableDailySnapshot[] = raw ? JSON.parse(raw) : [];
    const today = snapshotFromMetrics(metrics);
    const withoutToday = list.filter((d) => d.date !== today.date);
    const next = [today, ...withoutToday].slice(0, MAX_DAYS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  },

  async list(days: 7 | 30 = 7): Promise<WearableDailySnapshot[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const list: WearableDailySnapshot[] = raw ? JSON.parse(raw) : [];
    return list.slice(0, days);
  },
};
