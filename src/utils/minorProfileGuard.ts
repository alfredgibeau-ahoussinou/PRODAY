import type { ParentalSettings } from '../models/ParentalSettings';
import { DEFAULT_PARENTAL_SETTINGS } from '../models/ParentalSettings';
import type { User } from '../models/User';
import { isMinorAge, isMinorUser } from './minor';

/** Empêche un mineur de retirer son statut via un changement d’âge. */
export function assertMinorAgeChangeAllowed(user: User, parsedAge: number | null): void {
  if (!isMinorUser(user)) return;
  if (parsedAge != null && !isMinorAge(parsedAge)) {
    throw new Error(
      'Le statut mineur ne peut pas être retiré depuis l’application. Contactez le support avec l’accord d’un tuteur.',
    );
  }
}

export function mergePlayerParentalOnProfileEdit(
  user: User,
  parsedAge: number | null,
): ParentalSettings {
  assertMinorAgeChangeAllowed(user, parsedAge);
  const wasMinor = isMinorUser(user);
  const minor = parsedAge != null && isMinorAge(parsedAge);
  const effectiveMinor = wasMinor || minor;
  const base = user.parental_settings ?? DEFAULT_PARENTAL_SETTINGS;
  return {
    ...base,
    is_minor: effectiveMinor,
    ...(effectiveMinor
      ? {
          supervision_enabled: true,
          contacts_filter_enabled: true,
        }
      : {}),
  };
}

/** Bloque la désactivation des protections sur un compte mineur. */
export function enforceMinorParentalPatch(
  current: ParentalSettings | undefined,
  patch: Partial<ParentalSettings>,
): Partial<ParentalSettings> {
  if (!current?.is_minor) return patch;
  const safe = { ...patch };
  if (safe.contacts_filter_enabled === false) safe.contacts_filter_enabled = true;
  if (safe.supervision_enabled === false) safe.supervision_enabled = true;
  if (safe.is_minor === false) delete safe.is_minor;
  return safe;
}
