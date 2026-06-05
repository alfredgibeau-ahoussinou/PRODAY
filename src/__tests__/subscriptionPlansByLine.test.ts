import {
  getMercatoQuotaLabel,
  getPlanForRoleAndLine,
  isPlanAvailableOnLine,
  plansForProductLine,
} from '../content/subscriptionPlansByLine';

describe('subscriptionPlansByLine', () => {
  it('différencie joueur Man et joueuse Woman', () => {
    const man = getPlanForRoleAndLine('player', 'homme');
    const woman = getPlanForRoleAndLine('player', 'woman');

    expect(man?.label).toBe('Joueur Plus');
    expect(woman?.label).toBe('Joueuse Plus');
    expect(man?.freeIncludes.some((i) => i.includes('Mercato M'))).toBe(true);
    expect(woman?.freeIncludes.some((i) => i.includes('Mercato F'))).toBe(true);
    expect(getMercatoQuotaLabel('player', 'homme')).toContain('Mercato M');
    expect(getMercatoQuotaLabel('player', 'woman')).toContain('Mercato F');
  });

  it('n’expose pas les plans Pro sur Man/Woman', () => {
    expect(isPlanAvailableOnLine('coach_pro', 'homme')).toBe(false);
    expect(isPlanAvailableOnLine('physio_pro', 'woman')).toBe(false);
    expect(getPlanForRoleAndLine('coach', 'homme')).toBeNull();
    expect(getPlanForRoleAndLine('physio', 'woman')).toBeNull();
  });

  it('personnalise les métiers sur Pro', () => {
    const physio = getPlanForRoleAndLine('physio', 'pro');
    const recruiter = getPlanForRoleAndLine('recruiter', 'pro');

    expect(physio?.label).toBe('Cabinet Pro');
    expect(recruiter?.label).toBe('Recruteur Pro');
    expect(physio?.proIncludes.some((i) => i.includes('RDV'))).toBe(true);
    expect(recruiter?.freeIncludes.some((i) => i.includes('Mercato Pro'))).toBe(true);
  });

  it('liste les offres par univers', () => {
    expect(plansForProductLine('homme')).toHaveLength(1);
    expect(plansForProductLine('woman')[0].label).toBe('Joueuse Plus');
    expect(plansForProductLine('pro').length).toBeGreaterThanOrEqual(6);
  });
});
