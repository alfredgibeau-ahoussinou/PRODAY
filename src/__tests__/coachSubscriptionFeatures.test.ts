import {
  COACH_FREE_FEATURE_ICONS,
  COACH_PRO_FEATURE_ICONS,
  coachSubscriptionFeatureIcon,
} from '../content/coachSubscriptionFeatures';
import { getPlanForRoleAndLine } from '../content/subscriptionPlansByLine';

describe('coachSubscriptionFeatures', () => {
  it('aligne le nombre d’icônes Pro sur les unlocks coach', () => {
    const plan = getPlanForRoleAndLine('coach', 'pro');
    expect(plan?.proIncludes.length).toBe(COACH_PRO_FEATURE_ICONS.length);
    expect(plan?.freeIncludes.length).toBe(COACH_FREE_FEATURE_ICONS.length);
  });

  it('retombe sur l’icône fallback hors index', () => {
    expect(coachSubscriptionFeatureIcon('pro', 99, 'star')).toBe('star');
    expect(coachSubscriptionFeatureIcon('free', 0, 'people')).toBe('person');
  });
});
