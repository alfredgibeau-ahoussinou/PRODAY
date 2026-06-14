import { validateMatchJoin, buildMatchRecommendations } from '../core/recommendation/recommendation.engine';
import { computeProgression } from '../core/gamification/progression.engine';
import { computeHealthSnapshot } from '../core/health/healthState.engine';
import { isV3ShellEnabled } from '../config/featureFlags';

describe('core Phase 0', () => {
  it('bloque un match si santé en surcharge', () => {
    const health = computeHealthSnapshot({
      globalScore: 40,
      upcomingEventsCount: 6,
      pendingConvocations: 3,
      recentMatchCount: 4,
      streakDays: 1,
      profileCompletion: 50,
    });

    const check = validateMatchJoin({
      health,
      distanceKm: 3,
      levelScore: 80,
    });

    expect(check.allowed).toBe(false);
    expect(check.reasons.length).toBeGreaterThan(0);
  });

  it('score les matchs ouverts par proximité et niveau', () => {
    const health = computeHealthSnapshot({
      globalScore: 70,
      upcomingEventsCount: 1,
      pendingConvocations: 0,
      recentMatchCount: 1,
      streakDays: 3,
      profileCompletion: 80,
    });

    const recs = buildMatchRecommendations({
      openMatches: [
        {
          id: 'm1',
          requester_club_name: 'FC Test',
          opponent_club_name: 'AS Rival',
          city: 'Paris',
          date: new Date(),
          level: 'Régional',
          level_type: 'competition',
          location: { latitude: 48.86, longitude: 2.35 },
        },
      ],
      calendarItems: [],
      userLocation: { latitude: 48.87, longitude: 2.34 },
      userLevel: 'Régional',
      health,
      radiusKm: 5,
    });

    expect(recs).toHaveLength(1);
    expect(recs[0].iaScore).toBeGreaterThan(50);
    expect(recs[0].healthCompatible).toBe(true);
  });

  it('calcule la progression XP', () => {
    const state = computeProgression({ globalScore: 60, streakDays: 5 });
    expect(state.level).toBeGreaterThanOrEqual(1);
    expect(state.xp).toBeGreaterThan(0);
    expect(state.streakDays).toBe(5);
  });

  it('feature flag V3_SHELL désactivé par défaut', () => {
    const prev = process.env.EXPO_PUBLIC_V3_SHELL;
    delete process.env.EXPO_PUBLIC_V3_SHELL;
    expect(isV3ShellEnabled()).toBe(false);
    process.env.EXPO_PUBLIC_V3_SHELL = prev;
  });
});
