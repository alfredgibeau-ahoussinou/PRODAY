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

    expect(man?.label).toBe('Pass Joueur Premium');
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

  it('personnalise les métiers actifs sur Pro et ignore les rôles retirés', () => {
    const coach = getPlanForRoleAndLine('coach', 'pro');

    expect(coach?.label).toBe('Coach Pro');
    expect(coach?.freeIncludes.some((i) => i.includes('Mercato Pro'))).toBe(true);
    expect(coach?.proIncludes.some((i) => i.includes('Convocations'))).toBe(true);
    expect(coach?.proIncludes.some((i) => i.includes('Tactique IA'))).toBe(true);
    expect(coach?.proIncludes.some((i) => i.includes('Multi-équipes'))).toBe(true);
    expect(getPlanForRoleAndLine('recruiter', 'pro')).toBeNull();
    expect(getPlanForRoleAndLine('agent', 'pro')).toBeNull();
    expect(getPlanForRoleAndLine('physio', 'pro')).toBeNull();
  });

  it('ne mappe plus de plan rôle sur Santé (ligne retirée)', () => {
    expect(getPlanForRoleAndLine('physio', 'sante')).toBeNull();
    expect(plansForProductLine('sante')).toHaveLength(1);
    expect(plansForProductLine('sante')[0].id).toBe('physio_pro');
  });

  it('expose le plan joueur seul sur Joueur / Amateur (coach → Staff)', () => {
    const coach = getPlanForRoleAndLine('coach', 'amateur');
    const player = getPlanForRoleAndLine('player', 'amateur');
    const coachStaff = getPlanForRoleAndLine('coach', 'pro_staff');

    expect(coach).toBeNull();
    expect(player?.label).toBe('Joueur Amateur');
    expect(player?.freeIncludes.some((i) => i.includes('Mercato Amateur'))).toBe(true);
    expect(plansForProductLine('amateur')).toHaveLength(1);
    expect(isPlanAvailableOnLine('coach_pro', 'amateur')).toBe(false);
    expect(isPlanAvailableOnLine('player_plus', 'amateur')).toBe(true);
    expect(isPlanAvailableOnLine('coach_pro', 'pro_staff')).toBe(true);
    expect(coachStaff?.role).toBe('coach');
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
    expect(plansForProductLine('homme')[0].label).toBe('Pass Joueur Premium');
    expect(plansForProductLine('woman')[0].label).toBe('Joueuse Plus');
    expect(plansForProductLine('pro').length).toBeGreaterThanOrEqual(5);
  });
});
