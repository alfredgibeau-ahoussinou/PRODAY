jest.mock('../services/brainState.service', () => ({
  flushBrainState: jest.fn(() => Promise.resolve()),
  hydrateBrainState: jest.fn(() => Promise.resolve(null)),
}));

import { dispatchUserAction } from '../core/actionDispatch';
import { buildStaffPriorities } from '../features/v3/engines/staffHome.engine';
import type { User } from '../models/User';

const staff: User = {
  uid: 'coach-1',
  display_name: 'Coach Dupont',
  email: 'c@test.com',
  role: 'coach',
  is_verified: true,
  verification_status: 'VERIFIED',
  profile: { club_id: 'club-1', level: 'National' },
  documents: [],
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
  city: 'Paris',
};

describe('Phase 11 — Staff actions + accueil staff', () => {
  it('attribue XP publish_mercato et review_application', () => {
    const publish = dispatchUserAction(staff, 'publish_mercato', {
      upcomingEventsCount: 0,
      pendingConvocations: 0,
      recentMatchCount: 0,
      streakDays: 1,
      globalScore: 70,
    });
    expect(publish.progressionDelta.xp).toBe(18);

    const review = dispatchUserAction(staff, 'review_application', {
      upcomingEventsCount: 0,
      pendingConvocations: 0,
      recentMatchCount: 0,
      streakDays: 1,
      globalScore: 70,
    });
    expect(review.progressionDelta.xp).toBe(10);
  });

  it('priorise convocations et candidatures staff sur l’accueil', () => {
    const items = buildStaffPriorities({
      pendingConvocations: 2,
      pendingApplications: 5,
      myPostsCount: 1,
      upcomingEvents: 3,
    });
    expect(items[0].id).toBe('convoc');
    expect(items.some((item) => item.id === 'applications')).toBe(true);
    expect(items.some((item) => item.id === 'team-mgmt' && item.action === 'gestion')).toBe(true);
    expect(
      items.every(
        (item) =>
          item.action === 'gestion' || item.tab === 'matchs' || item.tab === 'recrutement'
      )
    ).toBe(true);
  });

  it('suggère de publier une annonce sans post actif', () => {
    const items = buildStaffPriorities({
      pendingConvocations: 0,
      pendingApplications: 0,
      myPostsCount: 0,
      upcomingEvents: 0,
    });
    expect(items.some((item) => item.id === 'publish')).toBe(true);
  });
});
