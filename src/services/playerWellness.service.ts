import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlayerDailyWellness {
  date: string; // YYYY-MM-DD
  sleepHours: number; // e.g. 8
  sleepQuality: number; // 1-5
  soreness: number; // 1-5 (1=none, 5=severe)
  energy: number; // 1-5 (1=exhausted, 5=peak)
  stress: number; // 1-5 (1=relaxed, 5=overwhelmed)
  submittedAt: string; // ISO
  wellnessScore: number; // 0-100
  injuryRisk: 'low' | 'moderate' | 'high';
}

const WELLNESS_STORAGE_KEY = 'proday_player_wellness_';

export function calculateWellnessScore(input: {
  sleepHours: number;
  sleepQuality: number;
  soreness: number;
  energy: number;
  stress: number;
}): { score: number; risk: 'low' | 'moderate' | 'high' } {
  // Normalize components:
  // Sleep: 8h optimal (25 pts max)
  const sleepPts = Math.min(25, Math.round((input.sleepHours / 8) * 15 + (input.sleepQuality / 5) * 10));
  // Soreness: 1 is best (25 pts max)
  const sorenessPts = Math.round(((6 - input.soreness) / 5) * 25);
  // Energy: 5 is best (25 pts max)
  const energyPts = Math.round((input.energy / 5) * 25);
  // Stress: 1 is best (25 pts max)
  const stressPts = Math.round(((6 - input.stress) / 5) * 25);

  const total = Math.max(0, Math.min(100, sleepPts + sorenessPts + energyPts + stressPts));

  let risk: 'low' | 'moderate' | 'high' = 'low';
  if (total < 50 || input.soreness >= 4) {
    risk = 'high';
  } else if (total < 75 || input.soreness >= 3) {
    risk = 'moderate';
  }

  return { score: total, risk };
}

export const playerWellnessService = {
  async getTodayWellness(userId: string): Promise<PlayerDailyWellness | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const raw = await AsyncStorage.getItem(`${WELLNESS_STORAGE_KEY}${userId}_${today}`);
      if (!raw) return null;
      return JSON.parse(raw) as PlayerDailyWellness;
    } catch {
      return null;
    }
  },

  async saveTodayWellness(
    userId: string,
    data: Omit<PlayerDailyWellness, 'date' | 'submittedAt' | 'wellnessScore' | 'injuryRisk'>
  ): Promise<PlayerDailyWellness> {
    const today = new Date().toISOString().split('T')[0];
    const { score, risk } = calculateWellnessScore(data);

    const record: PlayerDailyWellness = {
      ...data,
      date: today,
      submittedAt: new Date().toISOString(),
      wellnessScore: score,
      injuryRisk: risk,
    };

    try {
      await AsyncStorage.setItem(
        `${WELLNESS_STORAGE_KEY}${userId}_${today}`,
        JSON.stringify(record)
      );
    } catch (e) {
      console.warn('[playerWellnessService] Storage error:', e);
    }

    return record;
  },
};
