import type { PlatformFeedPost } from '../../models/PlatformFeed';
import type { User, UserRole } from '../../models/User';
import { rankScore } from './recommendation.engine';

const ROLE_TYPE_BOOST: Partial<Record<UserRole, PlatformFeedPost['type'][]>> = {
  agent: ['poll'],
  physio: ['news'],
  coach: ['news'],
  club: ['news'],
  player: ['news', 'poll'],
};

/** Classement fil communauté — local, rôle, fraîcheur, engagement (annexe B). */
export function rankFeedPosts(params: {
  posts: PlatformFeedPost[];
  profile: User;
}): PlatformFeedPost[] {
  const city = params.profile.city?.trim().toLowerCase() ?? '';
  const role = params.profile.role;
  const preferredTypes = ROLE_TYPE_BOOST[role] ?? ['news', 'poll'];

  return [...params.posts]
    .map((post) => {
      const text = `${post.title} ${post.body}`.toLowerCase();
      let raw = 0.38;

      if (city && (text.includes(city) || post.author_name.toLowerCase().includes(city))) {
        raw += 0.22;
      }
      if (preferredTypes.includes(post.type)) raw += 0.12;

      const ageHours = (Date.now() - post.created_at.getTime()) / 3_600_000;
      raw += Math.max(0, 0.18 - ageHours / 168);

      if (post.type === 'poll' && post.poll_votes) {
        const votes = Object.values(post.poll_votes).reduce((sum, ids) => sum + ids.length, 0);
        raw += Math.min(0.12, votes * 0.015);
      }

      return { post, score: rankScore(raw) };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.post);
}
