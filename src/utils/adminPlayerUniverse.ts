import type { AppSpaceId } from '../models/AppSpace';
import { APP_SPACE_LABELS } from '../models/AppSpace';
import type { Gender, User } from '../models/User';
import type { JoueurAgeGroup } from './joueurExperienceTheme';
import {
  JOUEUR_UNIVERSE_LABELS,
  ageYearsAsOf,
  joueurAgeGroupFromYears,
  resolveJoueurAgeGroupFromBirth,
} from './joueurBirthAge';
import { adminGenderLabel } from './adminUserDisplay';

/** Genre éditable côté admin (hors legacy `minor`). */
export type AdminEditableGender = 'men' | 'women';

export function suggestAppSpaceForPlayer(
  gender: AdminEditableGender | null | undefined,
  ageGroup: JoueurAgeGroup,
): AppSpaceId {
  if (ageGroup === 'youth') return 'under_u13';
  if (ageGroup === 'teen') return gender === 'women' ? 'girls' : 'boys';
  return gender === 'women' ? 'women' : 'men';
}

/** Résout l’univers joueur depuis birth_date (prioritaire) ou age. */
export function resolveAdminPlayerAgeGroup(user: User): JoueurAgeGroup | null {
  if (user.role !== 'player') return null;
  const birth = user.profile?.birth_date;
  if (birth) return resolveJoueurAgeGroupFromBirth(birth);
  const age = user.profile?.age;
  if (age != null && Number.isFinite(age)) return joueurAgeGroupFromYears(age);
  return null;
}

export function resolveAdminPlayerAge(user: User): number | null {
  const birth = user.profile?.birth_date;
  if (birth) return ageYearsAsOf(birth);
  const age = user.profile?.age;
  return age != null && Number.isFinite(age) ? age : null;
}

export function adminUniverseShortLabel(ageGroup: JoueurAgeGroup | null | undefined): string {
  if (!ageGroup) return '—';
  return JOUEUR_UNIVERSE_LABELS[ageGroup].title;
}

export function adminUniverseRangeLabel(ageGroup: JoueurAgeGroup | null | undefined): string {
  if (!ageGroup) return 'Univers non défini';
  return JOUEUR_UNIVERSE_LABELS[ageGroup].range;
}

export function adminAppSpaceLabel(space: AppSpaceId | string | null | undefined): string {
  if (!space) return '—';
  if (space in APP_SPACE_LABELS) return APP_SPACE_LABELS[space as AppSpaceId];
  return String(space);
}

/** Ligne compacte pour listes Adhérents : « Homme · Monde -13 ». */
export function adminPlayerIdentityLine(user: User): string | null {
  if (user.role !== 'player') return null;
  const gender = adminGenderLabel(user.profile?.gender as Gender | undefined);
  const ageGroup = resolveAdminPlayerAgeGroup(user);
  const universe = adminUniverseShortLabel(ageGroup);
  const age = resolveAdminPlayerAge(user);
  const parts = [
    gender !== '—' ? gender : null,
    age != null ? `${age} ans` : null,
    universe !== '—' ? universe : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

export function editableGenderFromProfile(
  gender: Gender | null | undefined,
): AdminEditableGender | null {
  if (gender === 'men' || gender === 'women') return gender;
  return null;
}
