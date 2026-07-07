import {
  hasUnlimitedSupporterFeatures,
  isSupporterFreeAccess,
  isSupporterProductLine,
  isSupporterRole,
} from '../utils/supporterFreeAccess';
import { ROLES_WITHOUT_STORE_PLAN } from '../content/subscriptionPlans';
import { plansForProductLine, getPlanForRoleAndLine } from '../content/subscriptionPlansByLine';
import { checkFeatureAccess, emptyUsagePeriod } from '../utils/subscriptionLogic';

describe('supporterFreeAccess', () => {
  it('identifie le rôle et le pôle supporter', () => {
    expect(isSupporterRole('supporter')).toBe(true);
    expect(isSupporterRole('player')).toBe(false);
    expect(isSupporterProductLine('supporter')).toBe(true);
    expect(isSupporterFreeAccess('supporter', 'supporter')).toBe(true);
    expect(hasUnlimitedSupporterFeatures('supporter', 'supporter')).toBe(true);
  });

  it('exclut supporter des plans store', () => {
    expect(ROLES_WITHOUT_STORE_PLAN).toContain('supporter');
    expect(plansForProductLine('supporter')).toHaveLength(0);
    expect(getPlanForRoleAndLine('supporter', 'supporter')).toBeNull();
  });

  it('autorise toutes les features subscription pour supporter gratuit', () => {
    const usage = emptyUsagePeriod();
    usage.mercato_applications = 999;
    const result = checkFeatureAccess({
      role: 'supporter',
      tier: 'free',
      feature: 'mercato_apply',
      usage,
    });
    expect(result.allowed).toBe(true);
    expect(result.planId).toBeNull();
  });
});
