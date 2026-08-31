import { buildAdminWorkQueue, globalAdminSearch, moderationLoadScore } from '../utils/adminInsights';
import type { User } from '../models/User';
import type { PlatformStats } from '../services/admin.service';

describe('adminInsights', () => {
  it('priorise les vérifications avant les reels', () => {
    const users = [
      {
        uid: 'u1',
        display_name: 'Alex',
        email: 'a@test.com',
        role: 'player',
        verification_status: 'PENDING',
        created_at: new Date(),
      },
    ] as User[];

    const queue = buildAdminWorkQueue({
      users,
      communityReels: [
        {
          id: 'r1',
          author_name: 'Bob',
          caption: 'test',
          status: 'pending',
          theme: 'skills',
          created_at: new Date(),
        } as never,
      ],
      reelReports: [],
      payments: [],
      applications: [],
      posts: [],
    });

    expect(queue[0]?.kind).toBe('verification');
  });

  it('ajoute les adhésions et demandes d’abonnement en attente', () => {
    const queue = buildAdminWorkQueue({
      users: [],
      communityReels: [],
      reelReports: [],
      payments: [],
      applications: [],
      posts: [],
      memberships: [
        {
          id: 'm1',
          club_id: 'c1',
          team_id: 't1',
          player_uid: 'p1',
          player_name: 'Léa',
          status: 'pending',
          requested_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      subscriptionUpgradeRequests: [
        {
          id: 's1',
          user_uid: 'u2',
          plan_id: 'player_plus',
          role: 'player',
          display_name: 'Max',
          email: 'max@test.com',
          billing: 'monthly',
          status: 'pending',
          created_at: new Date(),
        },
      ],
      clubsById: { c1: 'AS Paris' },
    });
    expect(queue.map((i) => i.kind)).toEqual(
      expect.arrayContaining(['membership', 'subscription_request']),
    );
    expect(queue.find((i) => i.kind === 'membership')?.subtitle).toBe('AS Paris');
  });

  it('calcule la charge modération', () => {
    const stats: PlatformStats = {
      users: 10,
      players: 8,
      coaches: 1,
      agents: 0,
      clubs: 2,
      teamEvents: 3,
      friendlyMatches: 1,
      recruitmentPosts: 2,
      paymentRequests: 1,
      applications: 4,
      announcements: 0,
      pendingVerifications: 2,
      pendingCommunityReels: 3,
      reelReports: 1,
      pendingPayments: 1,
    };
    expect(moderationLoadScore(stats)).toBeGreaterThan(10);
  });

  it('recherche globale sur email', () => {
    const hits = globalAdminSearch('marie', {
      users: [
        {
          uid: '1',
          display_name: 'Marie',
          email: 'marie@club.fr',
          role: 'coach',
        } as User,
      ],
      clubs: [],
      posts: [],
      events: [],
    });
    expect(hits[0]?.kind).toBe('user');
  });
});
