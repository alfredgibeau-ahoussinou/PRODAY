import type { AppSpaceId } from '../models/AppSpace';

/** Suggère l'espace foot féminin selon l'âge à l'inscription. */
export function suggestFeminineAppSpaceFromAge(age: number): AppSpaceId {
  if (age < 13) return 'under_u13';
  if (age >= 20) return 'women';
  return 'girls';
}

/** Suggère l'espace foot masculin selon l'âge à l'inscription. */
export function suggestMasculineAppSpaceFromAge(age: number): AppSpaceId {
  if (age < 13) return 'under_u13';
  if (age >= 20) return 'men';
  return 'boys';
}
