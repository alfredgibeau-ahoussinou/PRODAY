import type { CarpoolHubMode } from './carpoolChapters';

/** i18n keys for coach carpool mode segments. */
export const COACH_CARPOOL_MODE_KEYS = {
  ride: 'coach.portal.carpool.mode.ride',
  drive: 'coach.portal.carpool.mode.drive',
  trips: 'coach.portal.carpool.mode.trips',
} as const satisfies Record<CarpoolHubMode, string>;

export const COACH_CARPOOL_MODES: CarpoolHubMode[] = ['ride', 'drive', 'trips'];
