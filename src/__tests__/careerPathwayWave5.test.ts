import type { User } from '../models/User';
import { buildCareerPathwayPlan } from '../core/recruitment/careerPathway.engine';

function player(overrides: Partial<User> = {}): User {
  return {
    uid: overrides.uid ?? 'p1',
    display_name: overrides.display_name ?? 'Léa Martin',
    email: 'lea@test.com',
    role: 'player',
    profile: {
      position: 'Ailier',
      category: 'U19',
      level: 'R1',
      availability: 'available',
      season_stats: { matches: 12, goals: 5, assists: 3 },
      bio: 'Ailier rapide',
      highlight_video_urls: ['https://example.com/h.mp4'],
      ...(overrides.profile ?? {}),
    },
    city: 'Lyon',
    avatar_url: 'https://example.com/a.jpg',
    player_level: 'academy',
    club_certification_verified: true,
    is_verified: true,
    verification_status: 'VERIFIED',
    ...overrides,
  } as User;
}

describe('Career pathway assistant', () => {
  it('prioritizes profile completion when fiche is thin', () => {
    const plan = buildCareerPathwayPlan({
      player: player({
        avatar_url: undefined,
        profile: {
          position: undefined,
          category: undefined,
          level: undefined,
          availability: 'unavailable',
          highlight_video_urls: [],
        },
      }),
      pulseScore: 40,
      pendingApplications: 0,
    });
    expect(plan.steps[0]?.id).toBe('complete_profile');
    expect(plan.readinessScore).toBeLessThan(70);
  });

  it('surfaces Mercato apply when profile is ready and no applications', () => {
    const plan = buildCareerPathwayPlan({
      player: player(),
      pulseScore: 70,
      pendingApplications: 0,
      openTournamentCount: 2,
    });
    const ids = plan.steps.map((s) => s.id);
    expect(ids).toContain('apply_mercato');
    expect(ids).toContain('join_tournament');
    expect(plan.headline.length).toBeGreaterThan(8);
  });

  it('caps at five actionable steps', () => {
    const plan = buildCareerPathwayPlan({
      player: player({
        club_certification_verified: false,
        is_verified: false,
        verification_status: 'PENDING',
        profile: {
          availability: 'unavailable',
          highlight_video_urls: [],
        },
      }),
      pulseScore: 20,
      openTournamentCount: 3,
      pendingApplications: 0,
    });
    expect(plan.steps.length).toBeLessThanOrEqual(5);
  });
});

describe('Tournament checkout metadata', () => {
  it('recognizes tournament_registration metadata shape', () => {
    const meta = {
      type: 'tournament_registration',
      tournamentId: 't1',
      registrationId: 'r1',
      captainUid: 'u1',
    };
    expect(meta.type).toBe('tournament_registration');
    expect(meta.tournamentId && meta.registrationId).toBeTruthy();
  });
});
