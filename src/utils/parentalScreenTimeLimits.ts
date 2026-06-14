import { DEFAULT_PARENTAL_SETTINGS, type ParentalSettings } from '../models/ParentalSettings';

export function resolveDailyLimitMinutes(settings: ParentalSettings): number {
  const limit = settings.daily_limit_minutes ?? DEFAULT_PARENTAL_SETTINGS.daily_limit_minutes;
  return Math.max(15, Math.min(480, limit));
}
