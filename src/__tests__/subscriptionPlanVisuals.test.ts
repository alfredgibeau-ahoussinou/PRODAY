import { getSubscriptionPlanVisual } from '../content/subscriptionPlanVisuals';

describe('subscriptionPlanVisuals', () => {
  it('donne un hero clair Woman et sombre Man pour les joueurs', () => {
    const man = getSubscriptionPlanVisual('player', 'homme');
    const woman = getSubscriptionPlanVisual('player', 'woman');

    expect(man?.heroMode).toBe('dark');
    expect(woman?.heroMode).toBe('light');
    expect(man?.primary).toBe('#0A0A0A');
    expect(woman?.primary).toBe('#BE185D');
    expect(man?.ctaVerb).toContain('Joueur');
    expect(woman?.ctaVerb).toContain('Joueuse');
  });

  it('différencie visuellement chaque métier Pro', () => {
    const coach = getSubscriptionPlanVisual('coach', 'pro');
    const recruiter = getSubscriptionPlanVisual('recruiter', 'pro');
    const physio = getSubscriptionPlanVisual('physio', 'pro');
    const agent = getSubscriptionPlanVisual('agent', 'pro');

    expect(coach?.icon).toBe('people');
    expect(recruiter?.icon).toBe('search');
    expect(physio?.heroMode).toBe('light');
    expect(agent?.priceStyle).toBe('premium');
    expect(coach?.heroBg).not.toBe(recruiter?.heroBg);
    expect(physio?.rootBg).not.toBe(agent?.rootBg);
  });
});
