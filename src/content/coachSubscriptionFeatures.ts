import type { IconName } from '../components/ui/iconNames';

/** Icônes Pro — ordre aligné sur `coach_pro.proIncludes` (base + ligne Pro). */
export const COACH_PRO_FEATURE_ICONS: readonly IconName[] = [
  'checkmark-circle',
  'tune',
  'school',
  'trophy',
  'people',
];

/** Icônes Gratuit — ordre aligné sur `coach_pro.freeIncludes`. */
export const COACH_FREE_FEATURE_ICONS: readonly IconName[] = [
  'person',
  'people',
  'calendar',
  'chat',
];

export function coachSubscriptionFeatureIcon(
  tier: 'free' | 'pro',
  index: number,
  fallback: IconName,
): IconName {
  const list = tier === 'pro' ? COACH_PRO_FEATURE_ICONS : COACH_FREE_FEATURE_ICONS;
  return list[index] ?? fallback;
}
