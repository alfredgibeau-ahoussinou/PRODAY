import type { Gender, User } from '../models/User';
import type { RecruiterPlayerLevelFilter } from '../models/PlayerLevel';
import { RECRUITER_PLAYER_LEVEL_FILTERS } from '../models/PlayerLevel';
import {
  PLAYER_CATEGORIES as PLAYER_CATEGORY_OPTIONS,
  PLAYER_LEVELS as PLAYER_LEVEL_OPTIONS,
  PLAYER_POSITIONS as PLAYER_POSITION_OPTIONS,
} from '../constants/playerProfile';
import { playerLevelMatchesFilter, resolvePlayerLevel } from './playerLevelBadge';

export const PLAYER_POSITIONS_FILTER = ['Tous', ...PLAYER_POSITION_OPTIONS] as const;
export const PLAYER_CATEGORIES_FILTER = ['Tous', ...PLAYER_CATEGORY_OPTIONS] as const;
export const PLAYER_LEVELS_FILTER = ['Tous', ...PLAYER_LEVEL_OPTIONS] as const;

/** Filtres badge Pôle Joueur (recruteurs). */
export const PLAYER_BADGE_LEVEL_FILTERS = RECRUITER_PLAYER_LEVEL_FILTERS;

/** Filtre genre recruteur — Homme / Femme (Pôle Joueur unique). */
export const PLAYER_GENDER_FILTERS = [
  { id: 'all' as const, label: 'Tous' },
  { id: 'men' as const, label: 'Homme' },
  { id: 'women' as const, label: 'Femme' },
] as const;

export type PlayerPositionFilter = (typeof PLAYER_POSITIONS_FILTER)[number];
export type PlayerCategoryFilter = (typeof PLAYER_CATEGORIES_FILTER)[number];
export type PlayerLevelFilter = (typeof PLAYER_LEVELS_FILTER)[number];
export type PlayerGenderFilter = (typeof PLAYER_GENDER_FILTERS)[number]['id'];

export interface PlayerListFilters {
  position: PlayerPositionFilter;
  category: PlayerCategoryFilter;
  level: PlayerLevelFilter;
  /** Badge Amateur / Centre / Pro (recruteurs). */
  playerBadge: RecruiterPlayerLevelFilter;
  /** Genre déclaré (ou déduit) — Homme / Femme. */
  gender: PlayerGenderFilter;
  city: string;
  maxAge: string;
}

export const DEFAULT_PLAYER_FILTERS: PlayerListFilters = {
  position: 'Tous',
  category: 'Tous',
  level: 'Tous',
  playerBadge: 'all',
  gender: 'all',
  city: '',
  maxAge: '',
};

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function matchesFilter(value: string | undefined, filter: string): boolean {
  if (filter === 'Tous') return true;
  return norm(value ?? '') === norm(filter);
}

export function parseMaxAgeFilter(maxAge: string): number | null {
  const trimmed = maxAge.trim();
  if (!trimmed) return null;
  const max = parseInt(trimmed.replace(/\D/g, ''), 10);
  return Number.isFinite(max) && max > 0 ? max : null;
}

/**
 * Résout le genre effectif pour le filtre recruteur.
 * Priorité : `profile.gender` → lignes legacy homme/woman → `app_space` → catégorie F.
 * `minor` sans signal H/F reste `minor` (exclu des filtres Homme/Femme).
 */
export function resolvePlayerGenderForFilter(
  user: Pick<User, 'profile' | 'product_line' | 'app_space'>,
): Gender | null {
  const declared = user.profile?.gender;
  if (declared === 'men' || declared === 'women') return declared;
  if (declared === 'minor') {
    const space = user.app_space;
    if (space === 'women' || space === 'girls') return 'women';
    if (space === 'men' || space === 'boys') return 'men';
    return 'minor';
  }

  const storedLine = user.product_line as string | undefined;
  if (storedLine === 'woman') return 'women';
  if (storedLine === 'homme') return 'men';

  const space = user.app_space;
  if (space === 'women' || space === 'girls') return 'women';
  if (space === 'men' || space === 'boys') return 'men';

  const category = user.profile?.category ?? '';
  if (/\bF\b/i.test(category) || /féminin|fille/i.test(category)) return 'women';

  return null;
}

export function matchesGenderFilter(
  user: Pick<User, 'profile' | 'product_line' | 'app_space'>,
  filter: PlayerGenderFilter,
): boolean {
  if (filter === 'all') return true;
  const resolved = resolvePlayerGenderForFilter(user);
  if (resolved == null) return false;
  return resolved === filter;
}

export function filterPlayers(users: User[], filters: PlayerListFilters): User[] {
  const maxAge = parseMaxAgeFilter(filters.maxAge);

  return users.filter((u) => {
    const p = u.profile;
    if (!matchesFilter(p.position, filters.position)) return false;
    if (!matchesFilter(p.category, filters.category)) return false;
    if (!matchesFilter(p.level, filters.level)) return false;
    if (!playerLevelMatchesFilter(resolvePlayerLevel(u), filters.playerBadge)) return false;
    if (!matchesGenderFilter(u, filters.gender)) return false;
    if (filters.city.trim()) {
      const city = norm(u.city ?? '');
      const want = norm(filters.city.trim());
      if (!city.includes(want)) return false;
    }
    if (maxAge != null) {
      const age = p.age;
      if (age == null || age > maxAge) return false;
    }
    return true;
  });
}

export function countActiveFilters(filters: PlayerListFilters): number {
  let n = 0;
  if (filters.position !== 'Tous') n++;
  if (filters.category !== 'Tous') n++;
  if (filters.level !== 'Tous') n++;
  if (filters.playerBadge !== 'all') n++;
  if (filters.gender !== 'all') n++;
  if (filters.city.trim()) n++;
  if (parseMaxAgeFilter(filters.maxAge) != null) n++;
  return n;
}

export function nextPlayerBadgeFilter(
  current: RecruiterPlayerLevelFilter,
): RecruiterPlayerLevelFilter {
  const ids = PLAYER_BADGE_LEVEL_FILTERS.map((f) => f.id);
  const idx = ids.indexOf(current);
  return ids[(idx + 1) % ids.length]!;
}

export function playerBadgeFilterLabel(id: RecruiterPlayerLevelFilter): string {
  return PLAYER_BADGE_LEVEL_FILTERS.find((f) => f.id === id)?.label ?? 'Tous';
}

export function nextPlayerGenderFilter(current: PlayerGenderFilter): PlayerGenderFilter {
  const ids = PLAYER_GENDER_FILTERS.map((f) => f.id);
  const idx = ids.indexOf(current);
  return ids[(idx + 1) % ids.length]!;
}

export function playerGenderFilterLabel(id: PlayerGenderFilter): string {
  return PLAYER_GENDER_FILTERS.find((f) => f.id === id)?.label ?? 'Tous';
}
