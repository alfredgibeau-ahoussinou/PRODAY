import type { User } from '../models/User';

/** Profils seed, tests de charge ou comptes démo — exclus de l’annuaire public. */
export function isSyntheticUser(user: Pick<User, 'uid' | 'email' | 'display_name'>): boolean {
  const uid = user.uid;
  if (uid.startsWith('seed_') || uid.startsWith('scale-u') || uid.startsWith('proday_seed')) {
    return true;
  }

  const email = user.email?.trim().toLowerCase() ?? '';
  if (
    email.endsWith('@scale.test') ||
    email.endsWith('.demo@proday.app') ||
    email.includes('.demo@') ||
    email === 'lucas.demo@proday.app' ||
    email === 'marc.demo@proday.app' ||
    email === 'karim.demo@proday.app'
  ) {
    return true;
  }

  if (/^user\d+@scale\.test$/.test(email)) return true;
  if (/^Joueur \d+$/.test(user.display_name.trim())) return true;

  return false;
}

export function filterRealUsers<T extends Pick<User, 'uid' | 'email' | 'display_name'>>(users: T[]): T[] {
  return users.filter((u) => !isSyntheticUser(u));
}
