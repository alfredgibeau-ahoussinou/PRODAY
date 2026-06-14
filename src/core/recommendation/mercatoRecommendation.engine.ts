import type { RecruitmentPost } from '../../models/Player';
import type { User } from '../../models/User';
import { rankScore } from './recommendation.engine';
import { distanceBetween } from '../../utils/geoLocation';

export interface MercatoPostRecommendation {
  postId: string;
  iaScore: number;
  fitLabel: 'Excellent' | 'Bon' | 'À explorer';
}

function positionFit(userPosition?: string, postPosition?: string): number {
  if (!userPosition || !postPosition) return 0.35;
  const u = userPosition.toLowerCase();
  const p = postPosition.toLowerCase();
  if (u === p) return 1;
  if (u.includes(p) || p.includes(u)) return 0.75;
  return 0.25;
}

function levelFit(userLevel?: string, postLevel?: string): number {
  if (!userLevel || !postLevel) return 0.4;
  const u = userLevel.toLowerCase();
  const p = postLevel.toLowerCase();
  if (u === p) return 1;
  if (u.includes(p) || p.includes(u)) return 0.7;
  return 0.35;
}

/** Ranking annonces Mercato — poste, niveau, ville, Pulse (spec §3). */
export function buildMercatoPostRecommendations(params: {
  profile: User;
  posts: RecruitmentPost[];
  pulseScore: number;
  profileCompletion: number;
}): MercatoPostRecommendation[] {
  const userCity = params.profile.city?.trim().toLowerCase();

  return params.posts
    .map((post) => {
      const posScore = positionFit(params.profile.profile.position, post.position);
      const lvlScore = levelFit(params.profile.profile.level, post.level);
      const distKm = distanceBetween(params.profile.location, post.location);
      const geoScore =
        distKm == null
          ? userCity && post.city.toLowerCase().includes(userCity)
            ? 0.85
            : 0.45
          : Math.max(0.2, 1 - distKm / 80);
      const pulseBoost = Math.min(0.12, params.pulseScore / 900);
      const completionBoost = params.profileCompletion * 0.0012;

      const raw =
        posScore * 0.38 +
        lvlScore * 0.28 +
        geoScore * 0.2 +
        pulseBoost +
        completionBoost;

      const iaScore = rankScore(raw);
      const fitLabel: MercatoPostRecommendation['fitLabel'] =
        iaScore >= 75 ? 'Excellent' : iaScore >= 55 ? 'Bon' : 'À explorer';

      return { postId: post.id, iaScore, fitLabel };
    })
    .sort((a, b) => b.iaScore - a.iaScore);
}

export function mercatoScoreMap(
  recs: MercatoPostRecommendation[]
): Map<string, MercatoPostRecommendation> {
  return new Map(recs.map((r) => [r.postId, r]));
}

export function sortPostsByMercatoFit(
  posts: RecruitmentPost[],
  recs: MercatoPostRecommendation[],
  enabled: boolean
): RecruitmentPost[] {
  if (!enabled || recs.length === 0) return posts;
  const order = new Map(recs.map((r, i) => [r.postId, i]));
  return [...posts].sort(
    (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999)
  );
}
