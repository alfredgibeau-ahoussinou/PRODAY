import type { User } from '../models/User';
import type { PlatformFeedPost } from '../models/PlatformFeed';
import { sanitizePublicUser } from '../utils/sanitizePublicUser';
import { rankFeedPosts } from '../core/recommendation/feedRanking.engine';

const SCALES = [1000, 10_000, 20_000, 50_000] as const;
const ROLES = ['player', 'coach', 'physio', 'agent', 'club', 'organizer'] as const;
const CITIES = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille'];

function makeUsers(n: number): User[] {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => ({
    uid: `u${i}`,
    email: `user${i}@scale.test`,
    phone: `060000${String(i).slice(-4)}`,
    display_name: `Joueur ${i}`,
    role: ROLES[i % ROLES.length],
    city: CITIES[i % CITIES.length],
    is_verified: i % 3 === 0,
    is_active: true,
    verification_status: 'NOT_REQUIRED' as const,
    documents: [],
    created_at: new Date(now - i * 60_000),
    updated_at: new Date(now - i * 30_000),
    profile: {
      club_id: `club-${i % 200}`,
      position: 'Milieu',
      level: 'Seniors',
      rating: (i % 50) / 10,
    },
    parental_settings:
      i % 17 === 0
        ? {
            is_minor: true,
            supervision_enabled: true,
            contacts_filter_enabled: true,
            screen_time_enabled: false,
            daily_limit_minutes: 120,
            active_days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          }
        : undefined,
    location: { latitude: 48.8 + (i % 100) * 0.01, longitude: 2.3 + (i % 100) * 0.01 },
  })) as User[];
}

function makePosts(n = 60): PlatformFeedPost[] {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    type: (i % 4 === 0 ? 'poll' : 'news') as PlatformFeedPost['type'],
    title: `Actu ${i}`,
    body: `Corps ${i} Paris`,
    author_name: `Auteur ${i}`,
    author_uid: `a${i}`,
    author_role: 'coach' as const,
    audience: 'all' as const,
    created_at: new Date(now - i * 3_600_000),
    poll_votes: i % 4 === 0 ? { opt1: ['u1'], opt2: ['u2', 'u3'] } : undefined,
  }));
}

function bench(fn: () => void): number {
  const t0 = performance.now();
  fn();
  return performance.now() - t0;
}

function matchesSearch(user: User, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  const p = user.profile;
  return (
    user.display_name.toLowerCase().includes(lower) ||
    (p.position?.toLowerCase().includes(lower) ?? false) ||
    (user.city?.toLowerCase().includes(lower) ?? false) ||
    (p.level?.toLowerCase().includes(lower) ?? false)
  );
}

/** Budgets ms — marge large pour CI / machines lentes */
function budget(scale: number, per1k: number, floor = 40): number {
  return Math.max(floor, (scale / 1000) * per1k);
}

describe('charge applicative (simulation utilisateurs)', () => {
  const viewer = makeUsers(1)[0];
  viewer.role = 'player';
  viewer.city = 'Paris';
  const posts = makePosts(60);

  for (const scale of SCALES) {
    describe(`${scale.toLocaleString('fr-FR')} utilisateurs`, () => {
      let users: User[];

      beforeAll(() => {
        users = makeUsers(scale);
      });

      it('sanitizePublicUser sur échantillon 500 profils', () => {
        const sample = users.slice(0, 500);
        const ms = bench(() => {
          for (const u of sample) sanitizePublicUser(u);
        });
        expect(ms).toBeLessThan(budget(500, 8, 30));
      });

      it('listByRole + recherche « Paris » (limite 50)', () => {
        const ms = bench(() => {
          const list = users
            .filter((u) => u.role === 'player')
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
            .slice(0, 50)
            .map(sanitizePublicUser)
            .filter((u) => matchesSearch(u, 'Paris'));
          expect(list.length).toBeGreaterThan(0);
        });
        expect(ms).toBeLessThan(budget(scale, 0.5, 15));
      });

      it('suggestions sociales (3 rôles × 50 profils)', () => {
        const ms = bench(() => {
          const roles = ['coach', 'physio', 'player'] as const;
          const suggestions: { score: number }[] = [];
          for (const role of roles) {
            const candidates = users
              .filter((u) => u.role === role)
              .slice(0, 50);
            for (const c of candidates) {
              let score = 55;
              if (c.city === viewer.city) score += 22;
              if (c.profile.club_id === viewer.profile.club_id) score += 18;
              if (c.is_verified) score += 5;
              suggestions.push({ score });
            }
          }
          suggestions.sort((a, b) => b.score - a.score);
          expect(suggestions.length).toBe(150);
        });
        expect(ms).toBeLessThan(budget(scale, 0.8, 20));
      });

      it('classement fil (60 posts)', () => {
        const ms = bench(() => {
          const ranked = rankFeedPosts({ posts, profile: viewer });
          expect(ranked.length).toBe(60);
        });
        expect(ms).toBeLessThan(25);
      });

      it('listMembersByClubId. Couverture club dense', () => {
        const denseClub = 'club-0';
        const membersInDb = users.filter((u) => u.profile.club_id === denseClub).length;
        const ms = bench(() => {
          const roles = ['player', 'coach', 'agent'] as const;
          const merged: User[] = [];
          for (const role of roles) {
            merged.push(
              ...users
                .filter((u) => u.role === role)
                .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
                .slice(0, 50),
            );
          }
          const visible = merged.filter((u) => u.profile.club_id === denseClub);
          expect(visible.length).toBeLessThanOrEqual(150);
          if (membersInDb > 150) {
            expect(visible.length).toBeLessThan(membersInDb);
          }
        });
        expect(ms).toBeLessThan(budget(scale, 0.6, 50));
      });
    });
  }
});
