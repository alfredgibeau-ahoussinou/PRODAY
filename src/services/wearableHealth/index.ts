export { connectWearableHealth, fetchWearableMetrics } from './connect';
export { getWearablePlatformLabel, isWearableHealthSupported } from './types';
export type { WearableHealthMetrics, WearablePlatformLabel } from './types';
export { applyWearableToHealthInput, wearableLoadPenalty, wearableRecoveryBonus } from './mergeHealthInput';
export {
  formatHeartRateValue,
  formatSleepValue,
  formatStepsValue,
  formatWearableSyncedAt,
  hasWearableData,
  wearableDataDisclaimer,
  wearableSourceLabel,
} from './formatWearableMetrics';
