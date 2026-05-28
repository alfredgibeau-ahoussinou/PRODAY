import type { User } from '../models/User';

export const MINOR_AGE_THRESHOLD = 18;

export function isMinorAge(age: number): boolean {
  return Number.isFinite(age) && age > 0 && age < MINOR_AGE_THRESHOLD;
}

/** Compte mineur : l'âge du profil prime ; sinon le flag d'inscription. */
export function isMinorUser(user: User): boolean {
  const age = user.profile?.age;
  if (age != null) return isMinorAge(age);
  return user.parental_settings?.is_minor === true;
}

export function parseAgeInput(value: string): number | null {
  const n = parseInt(value.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n < 5 || n > 99) return null;
  return n;
}
