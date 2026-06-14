import type { ParentalSettings } from '../models/ParentalSettings';
import { DEFAULT_PARENTAL_SETTINGS } from '../models/ParentalSettings';
import { resolveDailyLimitMinutes } from './parentalScreenTimeLimits';

export type GuardianScreenTimePatch = Partial<
  Pick<ParentalSettings, 'screen_time_enabled' | 'daily_limit_minutes' | 'active_days'>
>;

export function buildGuardianScreenTimeSettings(
  current: ParentalSettings | undefined,
  patch: GuardianScreenTimePatch,
): ParentalSettings {
  const base: ParentalSettings = {
    ...DEFAULT_PARENTAL_SETTINGS,
    ...current,
    is_minor: true,
    supervision_enabled: true,
    contacts_filter_enabled: true,
  };
  const daily_limit_minutes =
    patch.daily_limit_minutes != null
      ? resolveDailyLimitMinutes({
          ...base,
          daily_limit_minutes: patch.daily_limit_minutes,
        })
      : base.daily_limit_minutes;
  const active_days =
    patch.active_days?.length ? patch.active_days : base.active_days;
  return {
    ...base,
    screen_time_enabled:
      patch.screen_time_enabled ?? base.screen_time_enabled ?? true,
    daily_limit_minutes,
    active_days,
  };
}
