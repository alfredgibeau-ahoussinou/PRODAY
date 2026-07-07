import type { ProductLineId } from '../models/ProductLine';
import type { RecruitmentPost } from '../models/Player';

const PRO_LEVEL_MARKERS = ['R1', 'R2', 'N3', 'N2', 'N1', 'L1', 'L2', 'PRO'];

/** Niveaux considérés comme recrutement pro (R1 → N1, Ligue). */
export function isProRecruitmentLevel(level: string | undefined | null): boolean {
  if (!level) return false;
  const normalized = level.toUpperCase();
  return PRO_LEVEL_MARKERS.some((marker) => normalized.includes(marker));
}

export type MercatoPostScope = 'pro' | 'amateur' | 'all';

export function resolveMercatoPostScope(line: ProductLineId): MercatoPostScope {
  if (line === 'pro_player') return 'pro';
  if (line === 'amateur') return 'amateur';
  return 'all';
}

export function filterRecruitmentPostsByScope(
  posts: RecruitmentPost[],
  scope: MercatoPostScope,
): RecruitmentPost[] {
  if (scope === 'all') return posts;
  if (scope === 'pro') {
    return posts.filter((post) => isProRecruitmentLevel(post.level));
  }
  return posts.filter((post) => !isProRecruitmentLevel(post.level));
}
