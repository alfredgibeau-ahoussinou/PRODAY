import type { User } from '../models/User';

/** Filtre les membres par catégories d'événement (ex. U17, Seniors). */
export function filterMembersByCategory(
  members: User[],
  categories?: string[]
): User[] {
  if (!categories?.length) return members;
  return members.filter((m) => {
    const cat = m.profile.category;
    if (!cat) return true;
    return categories.includes(cat);
  });
}

export function memberUidsExcluding(
  members: User[],
  excludeUid?: string
): string[] {
  return members
    .map((m) => m.uid)
    .filter((uid) => uid !== excludeUid);
}
