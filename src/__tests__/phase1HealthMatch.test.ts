import { validateMatchJoin } from '../core/recommendation/recommendation.engine';
import { computeHealthSnapshot } from '../core/health/healthState.engine';

describe('Phase 1 — boucle santé → match', () => {
  const overloadedHealth = computeHealthSnapshot({
    globalScore: 40,
    upcomingEventsCount: 6,
    pendingConvocations: 3,
    recentMatchCount: 4,
    streakDays: 1,
    profileCompletion: 50,
  });

  it('bloque la participation en surcharge', () => {
    const check = validateMatchJoin({
      health: overloadedHealth,
      distanceKm: 2,
      levelScore: 90,
    });
    expect(check.allowed).toBe(false);
  });

  it('autorise un match loisir en fatigue modérée', () => {
    const health = computeHealthSnapshot({
      globalScore: 70,
      upcomingEventsCount: 1,
      pendingConvocations: 0,
      recentMatchCount: 1,
      streakDays: 3,
      profileCompletion: 80,
    });
    const check = validateMatchJoin({
      health,
      distanceKm: 5,
      levelScore: 75,
    });
    expect(check.allowed).toBe(true);
  });
});
