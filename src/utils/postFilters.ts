import type { RecruitmentPost } from '../models/Player';
import {
  PLAYER_CATEGORIES,
  PLAYER_LEVELS,
  type PlayerCategory,
  type PlayerLevel,
} from '../constants/playerProfile';
import {
  postMatchesPositionFilter,
  type PositionFilterId,
} from '../content/candidatureChapters';

export type PostListFilters = {
  position: PositionFilterId;
  level: 'all' | PlayerLevel;
  category: 'all' | PlayerCategory;
  city: string;
};

export const DEFAULT_POST_FILTERS: PostListFilters = {
  position: 'all',
  level: 'all',
  category: 'all',
  city: '',
};

export const POST_LEVEL_OPTIONS = [
  { id: 'all' as const, label: 'Tous niveaux' },
  ...PLAYER_LEVELS.map((l) => ({ id: l, label: l })),
];

export const POST_CATEGORY_OPTIONS = [
  { id: 'all' as const, label: 'Toutes catégories' },
  ...PLAYER_CATEGORIES.map((c) => ({ id: c, label: c })),
];

export function countActivePostFilters(filters: PostListFilters): number {
  let n = 0;
  if (filters.position !== 'all') n += 1;
  if (filters.level !== 'all') n += 1;
  if (filters.category !== 'all') n += 1;
  if (filters.city.trim()) n += 1;
  return n;
}

export function filterRecruitmentPosts(
  posts: RecruitmentPost[],
  filters: PostListFilters
): RecruitmentPost[] {
  const cityQ = filters.city.trim().toLowerCase();
  return posts.filter((post) => {
    if (!postMatchesPositionFilter(post.position, filters.position)) return false;
    if (filters.level !== 'all' && post.level !== filters.level) return false;
    if (filters.category !== 'all' && post.category !== filters.category) return false;
    if (cityQ && !post.city.toLowerCase().includes(cityQ)) return false;
    return true;
  });
}

import type { MercatoAlertCriteria } from '../services/mercatoAlerts.service';

export function postsMatchingAlert(
  posts: RecruitmentPost[],
  criteria: MercatoAlertCriteria
): RecruitmentPost[] {
  if (!criteria.enabled) return [];
  return filterRecruitmentPosts(
    posts.filter((p) => postMatchesTextSearch(p, criteria.search)),
    {
      position: criteria.position,
      level: criteria.level,
      category: criteria.category,
      city: criteria.city,
    }
  );
}

export function postMatchesTextSearch(post: RecruitmentPost, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    post.club_name.toLowerCase().includes(q) ||
    post.position.toLowerCase().includes(q) ||
    (post.title?.toLowerCase().includes(q) ?? false) ||
    post.city.toLowerCase().includes(q) ||
    post.category.toLowerCase().includes(q) ||
    post.level.toLowerCase().includes(q)
  );
}
