import type { Gender, User } from '../models/User';

/**
 * Infère `profile.gender` pour comptes legacy sans genre déclaré.
 * Utilisé par la migration client (homme/woman → amateur) et le backfill app_space.
 */
export function inferGenderFromLegacyUser(
  user: Pick<User, 'profile' | 'product_line' | 'app_space'>,
): Gender | null {
  if (user.profile?.gender) return null;

  if (user.product_line === 'woman') return 'women';
  if (user.product_line === 'homme') return 'men';

  const space = user.app_space;
  if (space === 'women' || space === 'girls') return 'women';
  if (space === 'men' || space === 'boys') return 'men';

  return null;
}
