import type { ParentalSettings } from '../models/ParentalSettings';
import { DEFAULT_PARENTAL_SETTINGS } from '../models/ParentalSettings';
import { resolveDailyLimitMinutes } from './parentalScreenTimeLimits';

export type GuardianScreenTimePatch = Partial<
  Pick<
    ParentalSettings,
    | 'screen_time_enabled'
    | 'daily_limit_minutes'
    | 'active_days'
    | 'approved_contacts'
    | 'screen_time_bonus_minutes'
    | 'screen_time_bonus_day'
    | 'unlock_request'
    | 'guardian_email_secondary'
    | 'emergency_contacts'
    | 'messaging_restricted'
    | 'privacy'
    | 'contacts_filter_enabled'
  >
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
    contacts_filter_enabled:
      patch.contacts_filter_enabled ?? base.contacts_filter_enabled ?? true,
    ...(patch.approved_contacts !== undefined
      ? { approved_contacts: patch.approved_contacts }
      : {}),
    ...(patch.screen_time_bonus_minutes !== undefined
      ? { screen_time_bonus_minutes: patch.screen_time_bonus_minutes }
      : {}),
    ...(patch.screen_time_bonus_day !== undefined
      ? { screen_time_bonus_day: patch.screen_time_bonus_day }
      : {}),
    ...(patch.unlock_request !== undefined ? { unlock_request: patch.unlock_request } : {}),
    ...(patch.guardian_email_secondary !== undefined
      ? { guardian_email_secondary: patch.guardian_email_secondary }
      : {}),
    ...(patch.emergency_contacts !== undefined
      ? { emergency_contacts: patch.emergency_contacts }
      : {}),
    ...(patch.messaging_restricted !== undefined
      ? { messaging_restricted: patch.messaging_restricted }
      : {}),
    ...(patch.privacy !== undefined
      ? { privacy: { ...base.privacy, ...patch.privacy } }
      : {}),
  };
}
