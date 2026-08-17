import type { User } from '../models/User';
import { matchesFootballCategory } from '../constants/footballCategories';

/** Filtre les membres par catégories d'événement (ex. U17, U17 District, Seniors). */
export function filterMembersByCategory(
  members: User[],
  categories?: string[],
): User[] {
  if (!categories?.length) return members;
  return members.filter((m) =>
    matchesFootballCategory(m.profile.category, categories),
  );
}

export function memberUidsExcluding(
  members: User[],
  excludeUid?: string,
): string[] {
  return members
    .map((m) => m.uid)
    .filter((uid) => uid !== excludeUid);
}
