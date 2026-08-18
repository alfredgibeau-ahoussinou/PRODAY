import { getSubscriptionPlanVisual } from '../content/subscriptionPlanVisuals';

describe('subscriptionPlanVisuals', () => {
  it('donne un hero clair Woman et sombre Man pour les joueurs', () => {
    const man = getSubscriptionPlanVisual('player', 'homme');
    const woman = getSubscriptionPlanVisual('player', 'woman');

    expect(man?.heroMode).toBe('dark');
    expect(woman?.heroMode).toBe('light');
    expect(man?.primary).toBe('#0A0A0A');
    expect(woman?.primary).toBe('#BE185D');
    expect(man?.ctaVerb).toContain('Pass Premium');
    expect(woman?.ctaVerb).toContain('Joueuse');
  });

  it('différencie les métiers Pro actifs et ignore les rôles retirés', () => {
    const coach = getSubscriptionPlanVisual('coach', 'pro');
    const club = getSubscriptionPlanVisual('club', 'pro');
    const organizer = getSubscriptionPlanVisual('organizer', 'pro');

    expect(coach?.icon).toBe('people');
    expect(coach?.compareTitle).toContain('Gratuit vs Coach Pro');
    expect(coach?.unlockHeadline).toBe('Ce que vous débloquez');
    expect(coach?.proHighlight).toContain('Tactique IA');
    expect(club?.icon).toBeTruthy();
    expect(organizer?.ctaVerb).toContain('Organisateur');
    expect(coach?.heroBg).not.toBe(club?.heroBg);

    expect(getSubscriptionPlanVisual('recruiter', 'pro')).toBeNull();
    expect(getSubscriptionPlanVisual('physio', 'pro')).toBeNull();
    expect(getSubscriptionPlanVisual('agent', 'pro')).toBeNull();
  });
});
