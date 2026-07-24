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

  it('applique la copy Joueuse sur Amateur + segment female', () => {
    const plan = getPlanForRoleAndLine('player', 'amateur', 'female');
    expect(plan?.label).toBe('Joueuse Plus');
    expect(getMercatoQuotaLabel('player', 'amateur', 'female')).toContain('Mercato F');
  });

  it('n’expose pas les plans Pro sur Man/Woman', () => {
    expect(isPlanAvailableOnLine('coach_pro', 'homme')).toBe(false);
    expect(isPlanAvailableOnLine('physio_pro', 'woman')).toBe(false);
    expect(getPlanForRoleAndLine('coach', 'homme')).toBeNull();
    expect(getPlanForRoleAndLine('physio', 'woman')).toBeNull();
  });

  it('personnalise les métiers sur Pro', () => {
    const recruiter = getPlanForRoleAndLine('recruiter', 'pro');

    expect(getPlanForRoleAndLine('physio', 'pro')).toBeNull();
    expect(recruiter?.label).toBe('Recruteur Pro');
    expect(recruiter?.freeIncludes.some((i) => i.includes('Mercato Pro'))).toBe(true);
  });

  it('expose le plan praticien sur Santé', () => {
    const physio = getPlanForRoleAndLine('physio', 'sante');

    expect(physio?.label).toBe('Cabinet Santé');
    expect(physio?.proIncludes.some((i) => i.includes('RDV'))).toBe(true);
    expect(plansForProductLine('sante')).toHaveLength(1);
  });

  it('expose les plans joueur et coach sur Amateur', () => {
    const coach = getPlanForRoleAndLine('coach', 'amateur');
    const player = getPlanForRoleAndLine('player', 'amateur');

    expect(coach?.label).toBe('Coach Amateur');
    expect(player?.label).toBe('Joueur Amateur');
    expect(coach?.freeIncludes.some((i) => i.includes('Mercato Amateur'))).toBe(true);
    expect(player?.freeIncludes.some((i) => i.includes('Mercato Amateur'))).toBe(true);
    expect(plansForProductLine('amateur')).toHaveLength(2);
    expect(isPlanAvailableOnLine('coach_pro', 'amateur')).toBe(true);
    expect(isPlanAvailableOnLine('player_plus', 'amateur')).toBe(true);
    expect(isPlanAvailableOnLine('coach_pro', 'homme')).toBe(false);
  });

  it('n’expose aucun plan payant sur Supporter', () => {
    expect(getPlanForRoleAndLine('supporter', 'supporter')).toBeNull();
    expect(plansForProductLine('supporter')).toHaveLength(0);
    expect(isPlanAvailableOnLine('player_plus', 'supporter')).toBe(false);
    expect(isPlanAvailableOnLine('player_plus', 'homme')).toBe(true);
    expect(isPlanAvailableOnLine('coach_pro', 'supporter')).toBe(false);
  });

  it('liste les offres par univers', () => {
    expect(plansForProductLine('homme')).toHaveLength(1);
    expect(plansForProductLine('woman')[0].label).toBe('Joueuse Plus');
    expect(plansForProductLine('pro').length).toBeGreaterThanOrEqual(5);
  });
});
