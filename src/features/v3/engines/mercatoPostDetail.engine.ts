import type { User } from '../../../models/User';
import type { RecruitmentPost } from '../../../models/Player';
import { getProfileCompletion } from '../../../utils/profileCompletion';
import {
  buildMercatoPostRecommendations,
  type MercatoPostRecommendation,
} from '../../../core/recommendation/mercatoRecommendation.engine';

/** Score IA de compatibilité pour une annonce Mercato (détail joueur). */
export function getPostMercatoFit(params: {
  profile: User;
  post: RecruitmentPost;
  pulseScore: number;
}): MercatoPostRecommendation | null {
  const recs = buildMercatoPostRecommendations({
    profile: params.profile,
    posts: [params.post],
    pulseScore: params.pulseScore,
    profileCompletion: getProfileCompletion(params.profile).percent,
  });
  return recs[0] ?? null;
}
