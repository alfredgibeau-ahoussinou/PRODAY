import type { AppSpaceId } from '../models/AppSpace';
import { normalizeAppSpace } from '../models/AppSpace';
import { PLAYER_CATEGORIES } from './playerProfile';

export const PLAYER_CATEGORIES_WOMEN = [
  'U13 F',
  'U15 F',
  'U17 F',
  'U19 F',
  'Seniors F',
  'D2 F',
  'D1 F',
] as const;

export const PLAYER_CATEGORIES_GIRLS = ['U13 F', 'U15 F', 'U17 F', 'U19 F'] as const;

export const PLAYER_CATEGORIES_MEN = [
  'Seniors',
  'Vétérans',
  'R3',
  'R2',
  'R1',
  'N3',
  'N2',
  'N1',
] as const;

export const PLAYER_CATEGORIES_BOYS = ['U13', 'U15', 'U17', 'U19'] as const;

/** Catégories FFF en dessous de U13 */
export const PLAYER_CATEGORIES_UNDER_U13 = [
  'U7',
  'U9',
  'U11',
  'U7 F',
  'U9 F',
  'U11 F',
] as const;

const YOUTH_PREFIXES = ['U13', 'U15', 'U17', 'U19'] as const;
const UNDER_U13_PREFIXES = ['U7', 'U9', 'U11'] as const;

function categoryUpper(cat?: string): string {
  return (cat ?? '').trim().toUpperCase();
}

function isFeminineCategory(cat?: string): boolean {
  const u = categoryUpper(cat);
  return u.includes(' F') || u.includes('FÉMIN') || u.endsWith(' F');
}

function isYouthCategory(cat?: string): boolean {
  const u = categoryUpper(cat);
  return YOUTH_PREFIXES.some((p) => u.startsWith(p));
}

export function isUnderU13Category(cat?: string): boolean {
  const u = categoryUpper(cat);
  return UNDER_U13_PREFIXES.some((p) => u.startsWith(p));
}

function resolveTargetSpace(raw?: string): AppSpaceId | undefined {
  if (!raw || raw === 'mixed') return undefined;
  return normalizeAppSpace(raw);
}

export function categoriesForAppSpace(space: AppSpaceId): readonly string[] {
  switch (space) {
    case 'women':
      return PLAYER_CATEGORIES_WOMEN;
    case 'girls':
      return PLAYER_CATEGORIES_GIRLS;
    case 'men':
      return PLAYER_CATEGORIES_MEN;
    case 'boys':
      return PLAYER_CATEGORIES_BOYS;
    case 'under_u13':
      return PLAYER_CATEGORIES_UNDER_U13;
    default:
      return [];
  }
}

export function defaultCategoriesForAppSpace(space: AppSpaceId): readonly string[] {
  const dedicated = categoriesForAppSpace(space);
  return dedicated.length > 0 ? dedicated : PLAYER_CATEGORIES;
}

export function postMatchesAppSpace(
  post: { category?: string; target_space?: AppSpaceId | string },
  space: AppSpaceId
): boolean {
  const target = resolveTargetSpace(post.target_space as string | undefined);
  if (target) return target === space;

  const cat = post.category;
  const fem = isFeminineCategory(cat);
  const youth = isYouthCategory(cat);
  const under = isUnderU13Category(cat);

  switch (space) {
    case 'under_u13':
      return under;
    case 'women':
      return fem && !youth && !under;
    case 'girls':
      return fem && youth && !under;
    case 'men':
      return !fem && !youth && !under;
    case 'boys':
      return !fem && youth && !under;
    default:
      return false;
  }
}

export function userMatchesAppSpace(
  user: { app_space?: AppSpaceId | string },
  space: AppSpaceId
): boolean {
  return normalizeAppSpace(user.app_space as string | undefined) === space;
}
