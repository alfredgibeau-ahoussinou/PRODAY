import type { AppSpaceId } from '../models/AppSpace';
import { normalizeAppSpace } from '../models/AppSpace';
import type { ProductLineId } from '../models/ProductLine';
import type { Gender } from '../models/User';

/** Poussins — catégories FFF U7 à U11. */
export const FOOTBALL_POUSSINS = ['U7', 'U9', 'U11'] as const;
export const FOOTBALL_POUSSINS_F = ['U7 F', 'U9 F', 'U11 F'] as const;

/** Jeunes — U13 à U19. */
export const FOOTBALL_YOUTH = ['U13', 'U15', 'U17', 'U18', 'U19'] as const;
export const FOOTBALL_YOUTH_F = ['U13 F', 'U15 F', 'U17 F', 'U18 F', 'U19 F'] as const;

/** Adultes & féminines senior. */
export const FOOTBALL_ADULTS = ['Seniors', 'Seniors F', 'Vétérans', 'Féminines'] as const;

/** Échelon district — jeunes amateur FFF. */
export const FOOTBALL_DISTRICT = [
  'U13 District',
  'U15 District',
  'U17 District',
  'U18 District',
  'U19 District',
] as const;

export const FOOTBALL_DISTRICT_F = [
  'U13 F District',
  'U15 F District',
  'U17 F District',
  'U18 F District',
  'U19 F District',
] as const;

/** Liste complète ordonnée — profils, convocations, filtres. */
export const FOOTBALL_AGE_CATEGORIES = [
  ...FOOTBALL_POUSSINS,
  ...FOOTBALL_POUSSINS_F,
  ...FOOTBALL_YOUTH,
  ...FOOTBALL_YOUTH_F,
  ...FOOTBALL_ADULTS,
] as const;

export const FOOTBALL_DISTRICT_CATEGORIES = [
  ...FOOTBALL_DISTRICT,
  ...FOOTBALL_DISTRICT_F,
] as const;

/** Sélection roster / match amical — sans suffixe district. */
export const FOOTBALL_ROSTER_CATEGORIES = [
  ...FOOTBALL_POUSSINS,
  ...FOOTBALL_YOUTH,
  'Seniors',
  'Féminines',
] as const;

export const FOOTBALL_ALL_EVENT_CATEGORIES = [
  ...FOOTBALL_AGE_CATEGORIES,
  ...FOOTBALL_DISTRICT_CATEGORIES,
] as const;

/** Niveaux de compétition — profil joueur, signup, filtres. */
export const FOOTBALL_COMPETITION_LEVELS = [
  'Loisir',
  'District',
  'Départemental',
  'R3',
  'R2',
  'R1',
  'N3',
  'N2',
  'N1',
] as const;

export type FootballAgeCategory = (typeof FOOTBALL_AGE_CATEGORIES)[number];
export type FootballDistrictCategory = (typeof FOOTBALL_DISTRICT_CATEGORIES)[number];
export type FootballCompetitionLevel = (typeof FOOTBALL_COMPETITION_LEVELS)[number];

export type FootballCategoryGroup = {
  id: 'poussins' | 'jeunes' | 'adultes' | 'district';
  labelKey: string;
  items: readonly string[];
};

/** Réordonne les groupes UI — ex. adultes en tête pour détection. */
export function orderFootballCategoryGroups(
  prioritize?: FootballCategoryGroup['id'],
): readonly FootballCategoryGroup[] {
  if (!prioritize) return FOOTBALL_EVENT_CATEGORY_GROUPS;
  const match = FOOTBALL_EVENT_CATEGORY_GROUPS.find((g) => g.id === prioritize);
  if (!match) return FOOTBALL_EVENT_CATEGORY_GROUPS;
  return [
    match,
    ...FOOTBALL_EVENT_CATEGORY_GROUPS.filter((g) => g.id !== prioritize),
  ];
}

/** Groupes pour chips UI (événements, convocations). */
export const FOOTBALL_EVENT_CATEGORY_GROUPS: readonly FootballCategoryGroup[] = [
  {
    id: 'poussins',
    labelKey: 'football.categoryGroup.poussins',
    items: [...FOOTBALL_POUSSINS, ...FOOTBALL_POUSSINS_F],
  },
  {
    id: 'jeunes',
    labelKey: 'football.categoryGroup.jeunes',
    items: [...FOOTBALL_YOUTH, ...FOOTBALL_YOUTH_F],
  },
  {
    id: 'adultes',
    labelKey: 'football.categoryGroup.adultes',
    items: [...FOOTBALL_ADULTS],
  },
  {
    id: 'district',
    labelKey: 'football.categoryGroup.district',
    items: [...FOOTBALL_DISTRICT_CATEGORIES],
  },
];

// --- Listes par espace app (ex-appSpaces) ---

export const PLAYER_CATEGORIES_WOMEN = [
  ...FOOTBALL_YOUTH_F,
  'Seniors F',
  'D2 F',
  'D1 F',
] as const;

export const PLAYER_CATEGORIES_GIRLS = [...FOOTBALL_YOUTH_F] as const;

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

export const PLAYER_CATEGORIES_BOYS = [...FOOTBALL_YOUTH] as const;

export const PLAYER_CATEGORIES_UNDER_U13 = [
  ...FOOTBALL_POUSSINS,
  ...FOOTBALL_POUSSINS_F,
] as const;

export const PLAYER_CATEGORIES_UNDER_U13_F = [...FOOTBALL_POUSSINS_F] as const;

/** Alias legacy — catégories profil joueur (U13 → Vétérans + poussins + F). */
export const PLAYER_CATEGORIES = FOOTBALL_AGE_CATEGORIES;

/** Alias legacy — niveaux profil joueur. */
export const PLAYER_LEVELS = FOOTBALL_COMPETITION_LEVELS;

export type PlayerCategory = FootballAgeCategory;
export type PlayerLevel = FootballCompetitionLevel;

const YOUTH_PREFIXES = ['U13', 'U15', 'U17', 'U18', 'U19'] as const;
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

export function defaultCategoriesForAppSpace(
  space: AppSpaceId,
  line?: ProductLineId,
  gender?: Gender,
): readonly string[] {
  if (space === 'under_u13' && (gender === 'women' || gender === 'minor' || line === 'woman')) {
    return PLAYER_CATEGORIES_UNDER_U13_F;
  }
  const dedicated = categoriesForAppSpace(space);
  return dedicated.length > 0 ? dedicated : PLAYER_CATEGORIES;
}

/** Catégories disponibles selon espace / genre — profils & signup. */
export function categoriesForRole(
  space?: AppSpaceId | string,
  gender?: Gender,
  line?: ProductLineId,
): readonly string[] {
  const normalized = space ? normalizeAppSpace(space as string) : undefined;
  if (!normalized) {
    if (gender === 'women') {
      return [...FOOTBALL_YOUTH_F, 'Seniors F', 'Féminines'];
    }
    return FOOTBALL_AGE_CATEGORIES;
  }
  return defaultCategoriesForAppSpace(normalized, line, gender);
}

export function postMatchesAppSpace(
  post: { category?: string; target_space?: AppSpaceId | string },
  space: AppSpaceId,
  line?: ProductLineId,
): boolean {
  const target = resolveTargetSpace(post.target_space as string | undefined);
  if (target) return target === space;

  const cat = post.category;
  const fem = isFeminineCategory(cat);
  const youth = isYouthCategory(cat);
  const under = isUnderU13Category(cat);

  switch (space) {
    case 'under_u13':
      if (line === 'woman') return under && fem;
      if (line === 'homme' || line === 'pro') return under && !fem;
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
  space: AppSpaceId,
): boolean {
  return normalizeAppSpace(user.app_space as string | undefined) === space;
}

/** Normalise une catégorie (retire le suffixe « District »). */
export function normalizeFootballCategory(cat: string): string {
  return cat.trim().replace(/\s+District$/i, '').trim();
}

function categoryMatchKey(cat: string): string {
  return normalizeFootballCategory(cat).trim().toUpperCase().replace(/\s+/g, ' ');
}

/**
 * Vérifie si la catégorie d'un membre correspond à une sélection
 * (U13 ≈ U13 District, variantes F, etc.).
 */
export function matchesFootballCategory(
  memberCategory: string | undefined,
  selectedCategories: readonly string[],
): boolean {
  if (!selectedCategories.length) return true;
  if (!memberCategory?.trim()) return true;

  const memberKey = categoryMatchKey(memberCategory);
  return selectedCategories.some((selected) => memberKey === categoryMatchKey(selected));
}
