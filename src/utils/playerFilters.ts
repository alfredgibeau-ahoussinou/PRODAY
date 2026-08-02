import type { User } from '../models/User';
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

export type PlayerPositionFilter = (typeof PLAYER_POSITIONS_FILTER)[number];
export type PlayerCategoryFilter = (typeof PLAYER_CATEGORIES_FILTER)[number];
export type PlayerLevelFilter = (typeof PLAYER_LEVELS_FILTER)[number];

export interface PlayerListFilters {
  position: PlayerPositionFilter;
  category: PlayerCategoryFilter;
  level: PlayerLevelFilter;
  /** Badge Amateur / Centre / Pro (recruteurs). */
  playerBadge: RecruiterPlayerLevelFilter;
  city: string;
  maxAge: string;
}

export const DEFAULT_PLAYER_FILTERS: PlayerListFilters = {
  position: 'Tous',
  category: 'Tous',
  level: 'Tous',
  playerBadge: 'all',
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

export function filterPlayers(users: User[], filters: PlayerListFilters): User[] {
  const maxAge = parseMaxAgeFilter(filters.maxAge);

  return users.filter((u) => {
    const p = u.profile;
    if (!matchesFilter(p.position, filters.position)) return false;
    if (!matchesFilter(p.category, filters.category)) return false;
    if (!matchesFilter(p.level, filters.level)) return false;
    if (!playerLevelMatchesFilter(resolvePlayerLevel(u), filters.playerBadge)) return false;
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
